import { cookies } from "next/headers";
import { AdminSidebar } from "./AdminSidebar";
import AdminLogin from "./AdminLogin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  // Se não tem a sessão do admin (senha mestra), exibe a tela de login
  if (!adminSession || adminSession.value !== "authenticated") {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-60">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
