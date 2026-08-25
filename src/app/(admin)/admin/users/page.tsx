"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAllUsers,
  createUserManually,
  updateUser,
  deleteUser,
  getUserAccess,
  grantProductAccess,
  revokeProductAccess,
  getAllProducts,
} from "@/actions/users";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  locale?: string;
  created_at: string;
}

interface ProductSimple {
  id: string;
  name: string;
}

interface AccessRow {
  id: string;
  product_id: string | null;
  products?: { id: string; name: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userAccess, setUserAccess] = useState<AccessRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formLocale, setFormLocale] = useState("pt");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [usersData, productsData] = await Promise.all([
      getAllUsers(),
      getAllProducts(),
    ]);
    setUsers(usersData);
    setAllProducts(productsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    setLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    const result = await createUserManually({
      email: formEmail,
      full_name: formName,
      locale: formLocale,
    });
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Usuário criado com sucesso!" });
      setShowCreateModal(false);
      loadData();
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!selectedUser) return;
    setSaving(true);
    const result = await updateUser(selectedUser.id, {
      email: formEmail,
      full_name: formName,
      locale: formLocale,
    });
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Usuário atualizado!" });
      setShowEditModal(false);
      loadData();
    }
    setSaving(false);
  }

  async function handleDelete(userId: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;
    const result = await deleteUser(userId);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Usuário excluído." });
      loadData();
    }
  }

  async function openAccessModal(user: UserRow) {
    setSelectedUser(user);
    const access = await getUserAccess(user.id);
    setUserAccess(access);
    setShowAccessModal(true);
  }

  async function toggleProductAccess(productId: string) {
    if (!selectedUser) return;
    const hasAccess = userAccess.some((a) => a.product_id === productId);

    if (hasAccess) {
      await revokeProductAccess(selectedUser.id, productId);
    } else {
      await grantProductAccess(selectedUser.id, productId);
    }

    const updatedAccess = await getUserAccess(selectedUser.id);
    setUserAccess(updatedAccess);
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const overlayStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
    overflowY: "auto", padding: "40px 16px",
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px", width: "100%", maxWidth: "520px",
    margin: "0 auto", display: "flex", flexDirection: "column",
  };
  const headerStyle: React.CSSProperties = {
    padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0
  };
  const bodyStyle: React.CSSProperties = {
    padding: "24px", display: "flex", flexDirection: "column", gap: "20px"
  };

  const renderModals = () => {
    if (typeof document === "undefined") return null;

    return createPortal(
      <>
        {/* Create Modal */}
        {showCreateModal && (
          <div style={overlayStyle} onClick={() => setShowCreateModal(false)}>
            <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
              <div style={headerStyle}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Criar Usuário</h2>
              </div>
              <div style={bodyStyle}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>E-mail *</label>
                  <input className="input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome</label>
                  <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Idioma</label>
                  <select className="input" value={formLocale} onChange={(e) => setFormLocale(e.target.value)}>
                    <option value="pt">Português</option>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleCreate} disabled={saving || !formEmail.trim()}>
                    {saving ? "Criando..." : "Criar Usuário"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div style={overlayStyle} onClick={() => setShowEditModal(false)}>
            <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
              <div style={headerStyle}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Editar Usuário</h2>
              </div>
              <div style={bodyStyle}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>E-mail</label>
                  <input className="input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome</label>
                  <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Idioma</label>
                  <select className="input" value={formLocale} onChange={(e) => setFormLocale(e.target.value)}>
                    <option value="pt">Português</option>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Modal */}
        {showAccessModal && selectedUser && (
          <div style={overlayStyle} onClick={() => setShowAccessModal(false)}>
            <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
              <div style={headerStyle}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Gerenciar Acessos</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)", margin: "4px 0 0 0" }}>{selectedUser.email}</p>
              </div>
              <div style={bodyStyle}>
                {allProducts.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>Nenhum produto cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {allProducts.map((product) => {
                      const hasAccess = userAccess.some((a) => a.product_id === product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 transition-colors"
                          style={{
                            background: "var(--bg-secondary)",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${hasAccess ? "rgba(234, 88, 12, 0.3)" : "var(--border-subtle)"}`,
                          }}
                        >
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{product.name}</span>
                          <button className={`toggle ${hasAccess ? "active" : ""}`} onClick={() => toggleProductAccess(product.id)} />
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end mt-2">
                  <button className="btn-secondary" onClick={() => setShowAccessModal(false)}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Gestão de Usuários
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Gerencie usuários e controle acessos
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setFormEmail("");
            setFormName("");
            setFormLocale("pt");
            setShowCreateModal(true);
          }}
        >
          + Novo Usuário
        </button>
      </div>

      {message && (
        <div className={`toast mb-4 ${message.type === "success" ? "toast-success" : "toast-error"}`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder="Buscar por e-mail ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Idioma</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {user.full_name || "—"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {user.email}
                      </p>
                    </div>
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
                      {(user.locale || "pt").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-ghost text-xs py-1.5 px-3"
                        onClick={() => {
                          setSelectedUser(user);
                          setFormEmail(user.email);
                          setFormName(user.full_name || "");
                          setFormLocale(user.locale || "pt");
                          setShowEditModal(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-xs py-1.5 px-3 font-medium transition-colors"
                        style={{
                          color: "var(--accent-orange)",
                          background: "rgba(234, 88, 12, 0.1)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid rgba(234, 88, 12, 0.2)",
                        }}
                        onClick={() => openAccessModal(user)}
                      >
                        Acessos
                      </button>
                      <button className="btn-danger text-xs py-1.5 px-3" onClick={() => handleDelete(user.id)}>
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
      {renderModals()}
    </div>
  );
}
