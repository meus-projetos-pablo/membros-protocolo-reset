"use client";

import { useState, useEffect } from "react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions/users";

interface ProductRow {
  id: string;
  hotmart_product_id: string;
  name: string;
  description: string | null;
  locale?: string;
  created_at: string;
  books?: { id: string; title: string }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form
  const [hotmartId, setHotmartId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locale, setLocale] = useState("pt");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setHotmartId("");
    setName("");
    setDescription("");
    setLocale("pt");
    setShowModal(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setHotmartId(product.hotmart_product_id);
    setName(product.name);
    setDescription(product.description || "");
    setLocale(product.locale || "pt");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const data = {
      hotmart_product_id: hotmartId,
      name,
      description,
      locale,
    };

    if (editing) {
      const result = await updateProduct(editing.id, data);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Produto atualizado!" });
        setShowModal(false);
        loadData();
      }
    } else {
      const result = await createProduct(data);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Produto criado!" });
        setShowModal(false);
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete(productId: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const result = await deleteProduct(productId);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Produto excluído." });
      loadData();
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Produtos Hotmart
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Mapeie os produtos da Hotmart aos livros da plataforma
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo Produto
        </button>
      </div>

      {message && (
        <div className={`toast mb-4 ${message.type === "success" ? "toast-success" : "toast-error"}`}>
          {message.text}
        </div>
      )}

      {/* Info box */}
      <div
        className="p-4 mb-6 text-xs"
        style={{
          background: "rgba(234, 88, 12, 0.08)",
          border: "1px solid rgba(234, 88, 12, 0.2)",
          borderRadius: "var(--radius-md)",
          color: "var(--accent-orange)",
        }}
      >
        <strong>Como funciona:</strong> Cadastre aqui o ID numérico do seu produto na Hotmart.
        Depois, ao criar um livro, vincule-o a este produto. Quando uma compra for aprovada via webhook,
        o sistema liberará automaticamente o acesso a todos os livros vinculados ao produto.
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3 opacity-30">🏷️</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhum produto cadastrado.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>ID Hotmart</th>
                <th>Idioma</th>
                <th>Livros Vinculados</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <code
                      className="text-xs px-2 py-1"
                      style={{
                        background: "var(--bg-surface)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--accent-orange)",
                      }}
                    >
                      {product.hotmart_product_id}
                    </code>
                  </td>
                  <td>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "#888",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {(product.locale || "pt").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {product.books && product.books.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.books.map((book) => (
                          <span
                            key={book.id}
                            className="text-[10px] px-2 py-0.5"
                            style={{
                              background: "rgba(234, 88, 12, 0.1)",
                              color: "var(--accent-orange)",
                              borderRadius: "999px",
                              border: "1px solid rgba(234, 88, 12, 0.2)",
                            }}
                          >
                            {book.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Nenhum
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs">
                      {new Date(product.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => openEdit(product)}>
                        Editar
                      </button>
                      <button className="btn-danger text-xs py-1.5 px-3" onClick={() => handleDelete(product.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {editing ? "Editar Produto" : "Novo Produto"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  ID do Produto Hotmart *
                </label>
                <input
                  className="input"
                  value={hotmartId}
                  onChange={(e) => setHotmartId(e.target.value)}
                  placeholder="Ex: 123456"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Nome do Produto *
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Protocolo Reset - Plano Completo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Descrição
                </label>
                <textarea
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional"
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Idioma
                </label>
                <select
                  className="input"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !hotmartId.trim() || !name.trim()}
              >
                {saving ? "Salvando..." : editing ? "Salvar" : "Criar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
