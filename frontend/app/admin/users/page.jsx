"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "founder", label: "Founder" },
];

const ROLE_ORDER = ["user", "supervisor", "manager", "admin", "founder"];

const canAssign = (currentRole, targetRole) =>
  ROLE_ORDER.indexOf(currentRole) >= ROLE_ORDER.indexOf(targetRole);

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [passwords, setPasswords] = useState({});
  const [passwordStatus, setPasswordStatus] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    company_id: "",
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [editDrafts, setEditDrafts] = useState({});
  const [editStatus, setEditStatus] = useState({});
  const [welcomeStatus, setWelcomeStatus] = useState({});

  const isFounder = currentUser?.role === "founder";

  const filteredRoleOptions = useMemo(
    () => ROLE_OPTIONS.filter((option) => !currentUser || canAssign(currentUser.role, option.value)),
    [currentUser],
  );

  const canSubmit = useMemo(() => {
    return form.name.trim() && form.email.trim() && form.password.trim();
  }, [form]);

  const companyMap = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => map.set(company.id, company.name));
    return map;
  }, [companies]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesCompany = companyFilter === "all" || user.company_id === companyFilter;
        if (!query) return matchesRole && matchesCompany;
        const haystack = `${user.name} ${user.email} ${user.username || ""} ${user.company_name || ""} ${companyMap.get(user.company_id) || ""}`.toLowerCase();
        return matchesRole && matchesCompany && haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companyFilter, companyMap, roleFilter, search, users]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetchWithAuth("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCurrentUser(data);
      } catch (error) {
        console.warn("Unable to load profile", error);
      }
    };

    const loadCompanies = async () => {
      if (!isFounder) return;
      try {
        const res = await fetchWithAuth("/api/companies");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setCompanies(data);
      } catch (error) {
        console.warn("Unable to load companies", error);
      }
    };

    const loadUsers = async () => {
      setStatus({ state: "loading", message: "" });
      try {
        const res = await fetchWithAuth("/api/users");
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          if (!cancelled) {
            setStatus({
              state: "error",
              message: detail?.detail || `Unable to load users (${res.status})`,
            });
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setUsers(Array.isArray(data) ? data : []);
          setStatus({ state: "idle", message: "" });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            state: "error",
            message: error instanceof Error ? error.message : "Failed to load users",
          });
        }
      }
    };

    loadProfile().then(loadCompanies);
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [isFounder]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordInput = (userId, value) => {
    setPasswords((prev) => ({ ...prev, [userId]: value }));
  };

  const updatePasswordStatus = (userId, next) => {
    setPasswordStatus((prev) => ({ ...prev, [userId]: next }));
  };

  const updateWelcomeStatus = (userId, next) => {
    setWelcomeStatus((prev) => ({ ...prev, [userId]: next }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus({ state: "saving", message: "" });

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      if (isFounder && form.company_id) payload.company_id = form.company_id;
      const res = await fetchWithAuth("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setStatus({
          state: "error",
          message: detail?.detail || `Unable to create user (${res.status})`,
        });
        return;
      }

      const created = await res.json();
      setUsers((prev) => [created, ...prev]);
      setForm({ name: "", email: "", password: "", role: form.role, company_id: form.company_id });
      setStatus({ state: "success", message: "User created" });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  };

  const sendWelcomeEmail = async (userId) => {
    updateWelcomeStatus(userId, { state: "sending" });
    try {
      const res = await fetchWithAuth("/api/admin/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        updateWelcomeStatus(userId, {
          state: "error",
          message: detail?.detail || `Unable to send welcome (${res.status})`,
        });
        return;
      }

      updateWelcomeStatus(userId, { state: "success", message: "Welcome email sent" });
    } catch (error) {
      updateWelcomeStatus(userId, {
        state: "error",
        message: error instanceof Error ? error.message : "Failed to send email",
      });
    }
  };

  const handleSetPassword = async (userId) => {
    const password = passwords[userId];
    if (!password?.trim()) return;
    updatePasswordStatus(userId, { state: "saving" });
    try {
      const res = await fetchWithAuth(`/api/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        updatePasswordStatus(userId, {
          state: "error",
          message: detail?.detail || `Unable to set password (${res.status})`,
        });
        return;
      }

      setPasswords((prev) => ({ ...prev, [userId]: "" }));
      updatePasswordStatus(userId, { state: "success", message: "Password updated" });
    } catch (error) {
      updatePasswordStatus(userId, {
        state: "error",
        message: error instanceof Error ? error.message : "Failed to set password",
      });
    }
  };

  const startEdit = (user) => {
    setEditDrafts((prev) => ({
      ...prev,
      [user.id]: {
        name: user.name || "",
        username: user.username || "",
        role: user.role,
        company_id: user.company_id,
      },
    }));
  };

  const handleEditChange = (userId, field, value) => {
    setEditDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));
  };

  const saveEdit = async (userId) => {
    const draft = editDrafts[userId];
    if (!draft) return;
    setEditStatus((prev) => ({ ...prev, [userId]: { state: "saving" } }));
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          username: draft.username,
          role: draft.role,
          company_id: isFounder ? draft.company_id : undefined,
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setEditStatus((prev) => ({
          ...prev,
          [userId]: { state: "error", message: detail?.detail || `Unable to update (${res.status})` },
        }));
        return;
      }

      const updated = await res.json();
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      setEditStatus((prev) => ({ ...prev, [userId]: { state: "success", message: "Updated" } }));
    } catch (error) {
      setEditStatus((prev) => ({
        ...prev,
        [userId]: {
          state: "error",
          message: error instanceof Error ? error.message : "Unable to update user",
        },
      }));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setCompanyFilter("all");
  };

  return (
    <AdminWall title="Admin users" description="Founders can manage any account; admins are scoped to their company and role." layout="wide">
      <section className="stack" style={{ gap: "1rem", maxWidth: "1200px" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Accounts</span>
          </div>
          <h1 style={{ margin: 0 }}>Manage users</h1>
          <p className="muted" style={{ margin: 0 }}>
            Create or update accounts with company-aware scoping. Founders can see all companies; admins are limited to their own tenant and cannot grant higher roles than their own.
          </p>
        </div>

        <div className="grid two-col" style={{ gap: "1rem", alignItems: "start" }}>
          <form className="card glass stack" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
            <div className="stack" style={{ gap: "0.25rem" }}>
              <h2 style={{ margin: 0 }}>Create user</h2>
              <p className="tiny muted" style={{ margin: 0 }}>
                Passwords are hashed server-side. Scope is limited by your role.
              </p>
            </div>
            <label className="stack" style={{ gap: "0.35rem" }}>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
            </label>
            <label className="stack" style={{ gap: "0.35rem" }}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="stack" style={{ gap: "0.35rem" }}>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                placeholder="Temporary password"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="stack" style={{ gap: "0.35rem" }}>
              Role
              <select value={form.role} onChange={(event) => handleChange("role", event.target.value)}>
                {filteredRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {isFounder && (
              <label className="stack" style={{ gap: "0.35rem" }}>
                Company
                <select
                  value={form.company_id}
                  onChange={(event) => handleChange("company_id", event.target.value)}
                >
                  <option value="">Default to your tenant</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button type="submit" disabled={!canSubmit || status.state === "saving"}>
              {status.state === "saving" ? "Creating…" : "Create user"}
            </button>
            {status.state === "success" && <div className="status-success">{status.message}</div>}
            {status.state === "error" && <div className="status-error">{status.message}</div>}
          </form>

          <div className="card surface stack" style={{ gap: "0.75rem" }}>
            <div className="stack" style={{ gap: "0.25rem" }}>
              <h2 style={{ margin: 0 }}>Existing users</h2>
              <p className="tiny muted" style={{ margin: 0 }}>
                Scope is limited by your role. Founders can move accounts between companies; admins stay within theirs.
              </p>
            </div>

            {status.state === "loading" && <div className="pill pill-soft">Loading users…</div>}

            <div className="chip-row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
              <label className="stack" style={{ gap: "0.2rem", flex: "1 1 240px", minWidth: "0" }}>
                <span className="tiny muted">Filter</span>
                <input
                  type="search"
                  placeholder="Search by name, email, or company"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="stack" style={{ gap: "0.2rem", width: "180px" }}>
                <span className="tiny muted">Role</span>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">All roles</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {isFounder && (
                <label className="stack" style={{ gap: "0.2rem", width: "200px" }}>
                  <span className="tiny muted">Company</span>
                  <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
                    <option value="all">All companies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button type="button" className="ghost" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="stack" style={{ gap: "0.5rem" }}>
              {users.length === 0 && status.state !== "loading" && (
                <div className="tiny muted">No users found for your scope.</div>
              )}
              {users.length > 0 && filteredUsers.length === 0 && (
                <div className="tiny muted">No users match your filters.</div>
              )}
              {filteredUsers.map((user) => {
                const draft = editDrafts[user.id];
                const editing = Boolean(draft);
                const companyName =
                  user.company_name || companyMap.get(user.company_id) || user.company_id || "Company";
                return (
                  <div key={user.id} className="card glass stack" style={{ gap: "0.45rem" }}>
                    <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="pill">{user.role}</span>
                      <span className="pill pill-outline">{user.email}</span>
                      <span className="pill pill-soft">{companyName}</span>
                    </div>
                    <div className="stack" style={{ gap: "0.35rem" }}>
                      <label className="stack" style={{ gap: "0.25rem" }}>
                        Name
                        <input
                          type="text"
                          value={editing ? draft.name : user.name}
                          onChange={(event) => handleEditChange(user.id, "name", event.target.value)}
                          onFocus={() => !editing && startEdit(user)}
                        />
                      </label>
                      <label className="stack" style={{ gap: "0.25rem" }}>
                        Username
                        <input
                          type="text"
                          value={editing ? draft.username : user.username || ""}
                          onChange={(event) => handleEditChange(user.id, "username", event.target.value)}
                          onFocus={() => !editing && startEdit(user)}
                        />
                      </label>
                      <div className="chip-row" style={{ gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                        <label className="stack" style={{ gap: "0.25rem" }}>
                          Role
                          <select
                            value={editing ? draft.role : user.role}
                            onChange={(event) => handleEditChange(user.id, "role", event.target.value)}
                            onFocus={() => !editing && startEdit(user)}
                          >
                            {filteredRoleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {isFounder && (
                          <label className="stack" style={{ gap: "0.25rem" }}>
                            Company
                            <select
                              value={editing ? draft.company_id : user.company_id}
                              onChange={(event) => handleEditChange(user.id, "company_id", event.target.value)}
                              onFocus={() => !editing && startEdit(user)}
                            >
                              {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                      <div className="chip-row" style={{ gap: "0.35rem", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <div className="chip-row" style={{ gap: "0.35rem" }}>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => saveEdit(user.id)}
                            disabled={editStatus[user.id]?.state === "saving"}
                          >
                            {editStatus[user.id]?.state === "saving" ? "Saving…" : "Save changes"}
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() =>
                              setEditDrafts((prev) => {
                                const next = { ...prev };
                                delete next[user.id];
                                return next;
                              })
                            }
                          >
                            Cancel
                          </button>
                        </div>
                        {editStatus[user.id]?.state === "success" && (
                          <span className="tiny status-success">{editStatus[user.id]?.message}</span>
                        )}
                        {editStatus[user.id]?.state === "error" && (
                          <span className="tiny status-error">{editStatus[user.id]?.message}</span>
                        )}
                      </div>
                    </div>
                    <div className="stack" style={{ gap: "0.35rem" }}>
                      <label className="stack" style={{ gap: "0.25rem" }}>
                        Set password
                        <input
                          type="password"
                          value={passwords[user.id] || ""}
                          onChange={(event) => handlePasswordInput(user.id, event.target.value)}
                          placeholder="Temporary password"
                          autoComplete="new-password"
                        />
                      </label>
                      <div className="chip-row" style={{ gap: "0.35rem", justifyContent: "space-between" }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleSetPassword(user.id)}
                          disabled={!passwords[user.id]?.trim() || passwordStatus[user.id]?.state === "saving"}
                        >
                          {passwordStatus[user.id]?.state === "saving" ? "Saving…" : "Set password"}
                        </button>
                        <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          {passwordStatus[user.id]?.state === "success" && (
                            <span className="tiny status-success">{passwordStatus[user.id]?.message}</span>
                          )}
                          {passwordStatus[user.id]?.state === "error" && (
                            <span className="tiny status-error">{passwordStatus[user.id]?.message}</span>
                          )}
                        </div>
                      </div>
                      <div className="chip-row" style={{ gap: "0.35rem", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => sendWelcomeEmail(user.id)}
                          disabled={welcomeStatus[user.id]?.state === "sending"}
                        >
                          {welcomeStatus[user.id]?.state === "sending" ? "Sending…" : "Send welcome email"}
                        </button>
                        <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          {welcomeStatus[user.id]?.state === "success" && (
                            <span className="tiny status-success">{welcomeStatus[user.id]?.message}</span>
                          )}
                          {welcomeStatus[user.id]?.state === "error" && (
                            <span className="tiny status-error">{welcomeStatus[user.id]?.message}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </AdminWall>
  );
}
