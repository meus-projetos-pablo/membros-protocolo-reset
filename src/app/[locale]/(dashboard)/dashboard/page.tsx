import { getUserBooks } from "@/actions/books";
import { getCurrentUser } from "@/actions/auth";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const books = await getUserBooks();
  const user = await getCurrentUser();
  const t = getDictionary(locale).dashboard;
  
  const firstName = user?.full_name?.split(" ")[0] || "";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] font-medium text-white tracking-tight mb-1">
          {firstName ? t.greeting.replace("{name}", firstName) : t.greeting.replace(", {name}", "").replace("{name}", "")}
        </h1>
        <p className="text-[14px] text-gray-500">
          {t.subtitle}
        </p>
      </div>

      {/* Books Grid / List */}
      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 border border-white/5 rounded-2xl bg-[#0f0f0f]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-700 mb-6">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">
            Sua biblioteca está vazia
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Os produtos que você adquirir aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pb-8">
          {books.map((book, i) => {
            return (
              <Link
                key={book.id}
                href={`/${locale}/reader/${book.id}`}
                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                  animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms both`,
                }}
              >
                <div className="w-full aspect-[1080/530] relative bg-[#111] overflow-hidden">
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-700">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
