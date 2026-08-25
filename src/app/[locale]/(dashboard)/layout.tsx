import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/actions/auth";

const VALID_LOCALES = ["pt", "es", "en"];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!VALID_LOCALES.includes(locale)) {
    redirect("/pt/dashboard");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] font-sans flex flex-col">
      {/* Top Nav Minimalista */}
      <header className="border-b border-white/5 w-full">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <img src="/logo-reset.png" alt="Protocolo Reset" className="w-14 md:w-16 object-contain drop-shadow-md" />
          </div>

          <div className="flex items-center gap-4">
            <form action={signOut}>
              <button type="submit" className="text-[15px] font-medium text-[#888888] hover:text-white transition-colors flex items-center gap-2 p-2 -mr-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Sair da conta</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 md:py-16">
        {children}
      </main>
    </div>
  );
}
