import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const admin = createSupabaseAdminClient();

  const [
    { count: usersCount },
    { count: booksCount },
    { count: accessCount },
    { count: productsCount },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("books").select("*", { count: "exact", head: true }),
    admin.from("user_access").select("*", { count: "exact", head: true }),
    admin.from("products").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Usuários",
      value: usersCount ?? 0,
      icon: "👥",
      color: "var(--accent-orange)",
    },
    {
      label: "Livros",
      value: booksCount ?? 0,
      icon: "📚",
      color: "var(--accent-amber)",
    },
    {
      label: "Acessos Concedidos",
      value: accessCount ?? 0,
      icon: "🔓",
      color: "var(--warning)",
    },
    {
      label: "Produtos Hotmart",
      value: productsCount ?? 0,
      icon: "🏷️",
      color: "var(--success)",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          Painel Administrativo
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Visão geral da plataforma Protocolo Reset
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="p-5 card"
            style={{
              animation: `slideUp 0.4s ease-out ${i * 100}ms both`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span
                className="text-xs font-semibold px-2 py-1"
                style={{
                  color: stat.color,
                  background: `${stat.color}15`,
                  borderRadius: "var(--radius-sm)",
                }}
              >
                Total
              </span>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
