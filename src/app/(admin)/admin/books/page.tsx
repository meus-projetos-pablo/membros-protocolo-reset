"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
} from "@/actions/books";
import { getAllProducts } from "@/actions/users";

interface BookRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  total_pages: number;
  product_id: string | null;
  created_at: string;
  content?: unknown;
  locale?: string;
  show_chapters?: boolean;
  products?: { name: string; hotmart_product_id: string } | null;
}

interface ProductRow {
  id: string;
  name: string;
  hotmart_product_id: string;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [contentRaw, setContentRaw] = useState("");
  const [locale, setLocale] = useState("pt");
  const [showChapters, setShowChapters] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [booksData, productsData] = await Promise.all([
      getAllBooks(),
      getAllProducts(),
    ]);
    setBooks(booksData);
    setProducts(productsData);
    setLoading(false);
  }

  function openCreate() {
    setEditingBook(null);
    setTitle("");
    setDescription("");
    setCoverUrl("");
    setProductId(products.length > 0 ? products[0].id : "");
    setLocale("pt");
    setShowChapters(true);
    setContentRaw(
      JSON.stringify(
        [{ chapter: "Capítulo 1", pages: ["<p>Conteúdo da página 1</p>"] }],
        null,
        2
      )
    );
    setShowModal(true);
  }

  function openEdit(book: BookRow) {
    setEditingBook(book);
    setTitle(book.title);
    setDescription(book.description || "");
    setCoverUrl(book.cover_image_url || "");
    setProductId(book.product_id || (products.length > 0 ? products[0].id : ""));
    setLocale(book.locale || "pt");
    setShowChapters(book.show_chapters !== false);
    setContentRaw(
      book.content ? JSON.stringify(book.content, null, 2) : ""
    );
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    let content;
    try {
      content = contentRaw ? JSON.parse(contentRaw) : [];
    } catch {
      setMessage({ type: "error", text: "JSON do conteúdo está inválido." });
      setSaving(false);
      return;
    }

    const bookData = {
      title,
      description,
      cover_image_url: coverUrl,
      product_id: productId || null,
      content,
      locale,
      show_chapters: showChapters,
    };

    if (editingBook) {
      const result = await updateBook(editingBook.id, bookData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Livro atualizado!" });
        setShowModal(false);
        loadData();
      }
    } else {
      const result = await createBook(bookData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Livro criado!" });
        setShowModal(false);
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete(bookId: string) {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    const result = await deleteBook(bookId);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Livro excluído." });
      loadData();
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white" style={{ letterSpacing: "-0.03em" }}>
            Gestão de Livros
          </h1>
          <p className="text-sm text-[#555]">
            Crie, edite e gerencie os livros da plataforma
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo Livro
        </button>
      </div>

      {message && (
        <div className={`toast mb-4 ${message.type === "success" ? "toast-success" : "toast-error"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3 opacity-30">📚</p>
          <p className="text-sm text-[#555]">
            Nenhum livro cadastrado. Clique em &quot;Novo Livro&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {(() => {
            const grouped = books.reduce((acc, book) => {
              const pId = book.product_id || "none";
              if (!acc[pId]) {
                acc[pId] = {
                  name: book.products?.name || "Sem Produto associado",
                  books: [],
                };
              }
              acc[pId].books.push(book);
              return acc;
            }, {} as Record<string, { name: string; books: BookRow[] }>);

            const sortedGroups = Object.values(grouped).sort((a, b) => {
              if (a.name === "Sem Produto associado") return 1;
              if (b.name === "Sem Produto associado") return -1;
              return a.name.localeCompare(b.name);
            });

            return sortedGroups.map((group) => (
              <div key={group.name} className="animate-fade-in">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-white/20 rounded-full inline-block"></span>
                  {group.name}
                  <span className="text-xs text-[#555] font-normal ml-2 bg-white/5 px-2 py-0.5 rounded-full">
                    {group.books.length} {group.books.length === 1 ? "livro" : "livros"}
                  </span>
                </h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Livro</th>
                        <th>Idioma</th>
                        <th>Páginas</th>
                        <th>Criado em</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.books.map((book) => {
                        const locale = book.locale || "pt";
                        let tagColor = "bg-green-500/10 text-green-500 border border-green-500/20";
                        if (locale === "es") tagColor = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
                        if (locale === "en") tagColor = "bg-blue-500/10 text-blue-500 border border-blue-500/20";

                        return (
                          <tr key={book.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                {book.cover_image_url ? (
                                  <img
                                    src={book.cover_image_url}
                                    alt={book.title}
                                    className="w-10 h-14 object-cover flex-shrink-0 rounded-lg"
                                  />
                                ) : (
                                  <div className="w-10 h-14 flex items-center justify-center flex-shrink-0 rounded-lg bg-white/5 border border-white/10">
                                    📖
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {book.title}
                                  </p>
                                  {book.description && (
                                    <p className="text-xs line-clamp-1 text-[#555]">
                                      {book.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`text-xs px-2 py-1 rounded-md font-medium uppercase ${tagColor}`}>
                                {locale}
                              </span>
                            </td>
                            <td>
                              <span className="text-sm font-medium text-white">
                                {book.total_pages}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-[#888]">
                                {new Date(book.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => openEdit(book)}>
                                  Editar
                                </button>
                                <button className="btn-danger text-xs py-1.5 px-3" onClick={() => handleDelete(book.id)}>
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {showModal && (
        <BookModal
          editingBook={editingBook}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          coverUrl={coverUrl}
          setCoverUrl={setCoverUrl}
          productId={productId}
          setProductId={setProductId}
          contentRaw={contentRaw}
          setContentRaw={setContentRaw}
          locale={locale}
          setLocale={setLocale}
          showChapters={showChapters}
          setShowChapters={setShowChapters}
          products={products}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function BookModal({
  editingBook,
  title,
  setTitle,
  description,
  setDescription,
  coverUrl,
  setCoverUrl,
  productId,
  setProductId,
  contentRaw,
  setContentRaw,
  locale,
  setLocale,
  showChapters,
  setShowChapters,
  products,
  saving,
  onSave,
  onClose,
}: {
  editingBook: BookRow | null;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  coverUrl: string;
  setCoverUrl: (v: string) => void;
  productId: string;
  setProductId: (v: string) => void;
  contentRaw: string;
  setContentRaw: (v: string) => void;
  locale: string;
  setLocale: (v: string) => void;
  showChapters: boolean;
  setShowChapters: (v: boolean) => void;
  products: ProductRow[];
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  // Use a portal to render outside the admin layout DOM tree
  // This avoids any overflow/transform/flex issues from parent containers
  if (typeof document === "undefined") return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 9999,
    overflowY: "auto",
    padding: "40px 16px",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#111111",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    marginBottom: "6px",
    color: "#888888",
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            {editingBook ? "Editar Livro" : "Novo Livro"}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do livro"
            />
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição breve do livro"
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label style={labelStyle}>URL da Capa</label>
            <input
              className="input"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... ou /covers/nome.jpg"
            />
          </div>

          <div>
            <label style={labelStyle}>Produto Hotmart</label>
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.hotmart_product_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Conteúdo (JSON)</label>
            <p style={{ fontSize: "10px", marginBottom: "6px", color: "#555555" }}>
              Formato: {`[{ "chapter": "Nome", "pages": ["<p>HTML aqui</p>"] }]`}
            </p>
            <textarea
              className="input"
              value={contentRaw}
              onChange={(e) => setContentRaw(e.target.value)}
              rows={5}
              style={{ resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
              placeholder='[{ "chapter": "Capítulo 1", "pages": ["<p>Conteúdo</p>"] }]'
            />
          </div>

          <div>
            <label style={labelStyle}>Idioma</label>
            <select
              className="input"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              <option value="pt">Português (PT)</option>
              <option value="es">Espanhol (ES)</option>
              <option value="en">Inglês (EN)</option>
            </select>
          </div>

          {/* Toggle Capítulos */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Exibir Capítulos</label>
              <p style={{ fontSize: "10px", color: "#555555", marginTop: "2px" }}>
                Mostra a aba de capítulos no leitor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChapters(!showChapters)}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                backgroundColor: showChapters ? "#ffffff" : "#333333",
                position: "relative",
                transition: "background-color 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: showChapters ? "23px" : "3px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: showChapters ? "#000000" : "#888888",
                  transition: "left 0.2s, background-color 0.2s",
                }}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving || !title.trim()}>
            {saving ? "Salvando..." : editingBook ? "Salvar" : "Criar Livro"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
