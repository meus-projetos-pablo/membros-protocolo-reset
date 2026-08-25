import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAccessGrantedEmail } from "@/lib/email";
import type { HotmartWebhookPayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Validate hottok
    const hottok = request.headers.get("x-hotmart-hottok");
    if (hottok !== process.env.HOTMART_HOTTOK) {
      console.error("Invalid hottok received");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: HotmartWebhookPayload = await request.json();

    // Only process approved purchases
    if (payload.event !== "PURCHASE_APPROVED") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const buyerEmail = payload.data.buyer.email.toLowerCase().trim();
    const buyerName = payload.data.buyer.name;
    const hotmartProductId = String(payload.data.product.id);

    const adminClient = createSupabaseAdminClient();

    // 1. Find product and get its locale
    const { data: product } = await adminClient
      .from("products")
      .select("id, locale")
      .eq("hotmart_product_id", hotmartProductId)
      .single();

    if (!product) {
      console.error("Product not found for hotmart ID:", hotmartProductId);
      return NextResponse.json(
        { message: "Product not mapped yet" },
        { status: 200 }
      );
    }

    const productLocale = product.locale || "pt";

    // 2. Create user if doesn't exist
    let userId: string;

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, locale")
      .eq("email", buyerEmail)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      // Don't overwrite locale if user already has one (keep first purchase locale)
    } else {
      // Create auth user (triggers profile creation via DB trigger)
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: buyerEmail,
          email_confirm: true,
          password: "UniversalPassword123!@#",
          user_metadata: { full_name: buyerName },
        });

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Update profile with name and locale from product
      await adminClient
        .from("profiles")
        .update({
          full_name: buyerName,
          locale: productLocale,
        })
        .eq("id", userId);
    }

    // 3. Find books linked to this product
    const { data: books } = await adminClient
      .from("books")
      .select("id")
      .eq("product_id", product.id);

    if (books && books.length > 0) {
      // Grant access to all books for this product
      const accessRecords = books.map((book) => ({
        user_id: userId,
        book_id: book.id,
        product_id: product.id,
      }));

      const { error: accessError } = await adminClient
        .from("user_access")
        .upsert(accessRecords, { onConflict: "user_id,book_id" });

      if (accessError) {
        console.error("Error granting access:", accessError);
      }
    }

    // 4. Send welcome email via Resend
    const emailResult = await sendAccessGrantedEmail(buyerEmail, buyerName, productLocale);
    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      // Don't return error — access was still granted
    }

    return NextResponse.json(
      { message: "Purchase processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
