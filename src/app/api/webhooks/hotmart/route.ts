import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAccessGrantedEmail } from "@/lib/email";
import type { HotmartWebhookPayload } from "@/lib/types";

// Helper for asynchronous pauses
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic retry wrapper with exponential backoff and jitter
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelayMs?: number; description?: string } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 350, description = "Operation" } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isLast = attempt === maxRetries;
      console.warn(
        `[Webhook Retry] ${description} attempt ${attempt}/${maxRetries} failed:`,
        err?.message || err
      );
      if (!isLast) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// Concurrency-safe user creation and retrieval
async function getOrCreateUser(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  fullName: string,
  locale: string
): Promise<{ userId: string }> {
  // 1. First check if profile already exists in DB
  const { data: existingProfile } = await retryWithBackoff(
    async () => {
      const res = await adminClient
        .from("profiles")
        .select("id, locale, full_name")
        .eq("email", email)
        .maybeSingle();
      if (res.error) throw res.error;
      return res;
    },
    { description: "Check existing profile" }
  );

  if (existingProfile?.id) {
    // If profile exists, ensure full_name is populated if previously missing
    if (!existingProfile.full_name && fullName) {
      await adminClient
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", existingProfile.id);
    }
    return { userId: existingProfile.id };
  }

  // 2. Profile not found, try to create user in Supabase Auth
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password: "UniversalPassword123!@#",
    user_metadata: { full_name: fullName },
  });

  if (newUser?.user?.id) {
    const userId = newUser.user.id;

    // Small delay to allow DB trigger to create initial profile, then upsert to guarantee accuracy
    await sleep(200);
    await retryWithBackoff(
      async () => {
        const res = await adminClient.from("profiles").upsert(
          {
            id: userId,
            email,
            full_name: fullName,
            locale: locale || "pt",
          },
          { onConflict: "id" }
        );
        if (res.error) throw res.error;
        return res;
      },
      { description: "Upsert profile for new user" }
    );

    return { userId };
  }

  // 3. If createUser failed, it is likely a RACE CONDITION (another webhook just created this user)
  console.warn(
    `[Webhook Concurrency] Auth user creation for ${email} did not return user. Recovering concurrently:`,
    createError?.message
  );

  // Poll profiles for up to 2.5 seconds
  for (let i = 0; i < 5; i++) {
    await sleep(350);
    const { data: profileAfterRace } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileAfterRace?.id) {
      return { userId: profileAfterRace.id };
    }
  }

  // 4. Fallback: Search directly in Supabase Auth via listUsers
  const { data: authList, error: listError } = await adminClient.auth.admin.listUsers();
  if (!listError && authList?.users) {
    const foundAuthUser = authList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (foundAuthUser?.id) {
      // Guarantee profile exists for this auth user
      await adminClient.from("profiles").upsert(
        {
          id: foundAuthUser.id,
          email,
          full_name: fullName,
          locale: locale || "pt",
        },
        { onConflict: "id" }
      );
      return { userId: foundAuthUser.id };
    }
  }

  throw new Error(
    `Failed to resolve or create user for email: ${email}. Reason: ${createError?.message || "Unknown auth error"}`
  );
}

// Concurrency-safe access granting
async function grantAccessToProductBooks(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  productId: string
): Promise<number> {
  const { data: books, error: booksError } = await retryWithBackoff(
    async () => {
      const res = await adminClient
        .from("books")
        .select("id")
        .eq("product_id", productId);
      if (res.error) throw res.error;
      return res;
    },
    { description: "Fetch books for product" }
  );

  if (booksError) {
    console.error("Error fetching books:", booksError);
    throw booksError;
  }

  if (!books || books.length === 0) {
    console.warn(`[Webhook Warning] No books mapped to product ${productId} yet.`);
    return 0;
  }

  const accessRecords = books.map((book) => ({
    user_id: userId,
    book_id: book.id,
    product_id: productId,
    granted_at: new Date().toISOString(),
  }));

  // Perform upsert with retries to protect against concurrent DB locks
  await retryWithBackoff(
    async () => {
      const res = await adminClient
        .from("user_access")
        .upsert(accessRecords, { onConflict: "user_id,book_id" });
      if (res.error) throw res.error;
      return res;
    },
    { description: "Upsert user_access records" }
  );

  return accessRecords.length;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let buyerEmail = "";
  let hotmartProductId = "";

  try {
    // 1. Validate hottok
    const hottok = request.headers.get("x-hotmart-hottok")?.trim();
    const isAdminTest = hottok === "__TEST_FROM_ADMIN__";

    if (isAdminTest) {
      const adminSession = request.cookies.get("admin_session");
      if (!adminSession || adminSession.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized test" }, { status: 401 });
      }
    } else {
      const expectedHottok = process.env.HOTMART_HOTTOK?.trim();
      if (!expectedHottok || hottok !== expectedHottok) {
        console.error("Invalid or missing hottok received");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Parse & validate payload
    let payload: HotmartWebhookPayload | any;
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error("Invalid JSON body received in webhook:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Support both root event and nested data.event
    const event = payload?.event || payload?.data?.event;

    // Only process approved purchases
    if (event !== "PURCHASE_APPROVED") {
      console.log(`[Webhook Info] Ignored event: ${event}`);
      return NextResponse.json({ message: `Event ${event} ignored` }, { status: 200 });
    }

    const rawEmail = payload?.data?.buyer?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
      console.error("Webhook missing buyer email:", payload);
      return NextResponse.json({ error: "Missing buyer email" }, { status: 400 });
    }

    buyerEmail = rawEmail.toLowerCase().trim();
    const buyerName = (payload?.data?.buyer?.name || "Estudante").trim();

    hotmartProductId = String(
      payload?.data?.product?.id || payload?.data?.product?.ucode || ""
    ).trim();

    if (!hotmartProductId) {
      console.error("Webhook missing product id:", payload);
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    const adminClient = createSupabaseAdminClient();

    // 3. Find product and get its locale and name with retry
    const { data: product } = await retryWithBackoff(
      async () => {
        const res = await adminClient
          .from("products")
          .select("id, name, locale")
          .eq("hotmart_product_id", hotmartProductId)
          .maybeSingle();
        if (res.error) throw res.error;
        return res;
      },
      { description: "Fetch product by hotmart ID" }
    );

    if (!product) {
      console.warn(`[Webhook Warning] Product not mapped for Hotmart ID: ${hotmartProductId}.`);
      return NextResponse.json(
        { message: `Product ${hotmartProductId} not mapped yet in database` },
        { status: 200 }
      );
    }

    const productLocale = product.locale || "pt";
    const productName = product.name || "Protocolo Reset";

    // 4. Concurrency-safe user creation / recovery
    const { userId } = await getOrCreateUser(
      adminClient,
      buyerEmail,
      buyerName,
      productLocale
    );

    // 5. Grant access to all books/modules linked to this product (concurrency-safe)
    const booksGranted = await grantAccessToProductBooks(
      adminClient,
      userId,
      product.id
    );

    // 6. Send access granted email (has 3 internal retries with backoff)
    const emailResult = await sendAccessGrantedEmail(
      buyerEmail,
      buyerName,
      productLocale,
      productName
    );

    if (!emailResult.success) {
      console.error(
        `[Webhook Warning] Access granted to user ${userId} for product ${product.id}, but email sending failed:`,
        emailResult.error
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Webhook Success] Processed purchase for ${buyerEmail} (User: ${userId}, Books: ${booksGranted}) in ${elapsed}ms`
    );

    return NextResponse.json(
      {
        message: "Purchase processed successfully",
        userId,
        booksGranted,
        emailSent: emailResult.success,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`[Webhook Fatal Error] Processing webhook for ${buyerEmail || "unknown"}:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
