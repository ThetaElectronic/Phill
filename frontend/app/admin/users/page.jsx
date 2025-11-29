"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../../components/AuthWall";
import { fetchWithAuth } from "../../../lib/api";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

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
  });

  const canSubmit = useMemo(() => {
    return form.name.trim() && form.email.trim() && form.password.trim();
  }, [form]);

  useEffect(() => {
    let cancelled = false;
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

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordInput = (userId, value) => {
    setPasswords((prev) => ({ ...prev, [userId]: value }));
  };

  const updatePasswordStatus = (userId, next) => {
    setPasswordStatus((prev) => ({ ...prev, [userId]: next }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus({ state: "saving", message: "" });

    try {
      const res = await fetchWithAuth("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
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
      setForm({ name: "", email: "", password: "", role: form.role });
      setStatus({ state: "success", message: "User created" });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  };

  const handleSetPassword = async (userId) => {
    const password = (passwords[userId] || "").trim();
    if (!password) return;

    updatePasswordStatus(userId, { state: "saving", message: "" });

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

  return (
    <AuthWall title="Admin users" description="Manage team accounts within your tenant.">
      <section className="stack" style={{ gap: "1rem", maxWidth: "960px" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Accounts</span>
          </div>
          <h1 style={{ margin: 0 }}>Manage users</h1>
          <p className="muted" style={{ margin: 0 }}>
            Create new accounts for your company. Admins cannot grant higher roles than their own, and access is enforced server-side.
          </p>
        </div>

        <div className="grid two-col" style={{ gap: "1rem" }}>
          <form className="card glass stack" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
            <div className="stack" style={{ gap: "0.25rem" }}>
              <h2 style={{ margin: 0 }}>Create user</h2>
              <p className="tiny muted" style={{ margin: 0 }}>
                Defaults to your company. Password is stored as a hash on the server.
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
              <select
                value={form.role}
                onChange={(event) => handleChange("role", event.target.value)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
                Scope is limited by your role. Admins see their own company; founders see all.
              </p>
            </div>

            {status.state === "loading" && <div className="pill pill-soft">Loading users…</div>}

            <div className="stack" style={{ gap: "0.5rem" }}>
              {users.length === 0 && status.state !== "loading" && (
                <div className="tiny muted">No users found for your scope.</div>
              )}
              {users.map((user) => (
                <div key={user.id} className="card glass stack" style={{ gap: "0.35rem" }}>
                  <div className="badge-list" style={{ gap: "0.35rem" }}>
                    <span className="pill">{user.role}</span>
                    <span className="pill pill-outline">{user.email}</span>
                  </div>
                  <div className="stack" style={{ gap: "0.1rem" }}>
                    <strong>{user.name}</strong>
                    <span className="tiny muted">{user.username}</span>
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
                    <div className="badge-list" style={{ gap: "0.35rem", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        className="pill pill-outline"
                        onClick={() => handleSetPassword(user.id)}
                        disabled={!passwords[user.id]?.trim() || passwordStatus[user.id]?.state === "saving"}
                      >
                        {passwordStatus[user.id]?.state === "saving" ? "Saving…" : "Set password"}
                      </button>
                      {passwordStatus[user.id]?.state === "success" && (
                        <span className="tiny status-success">{passwordStatus[user.id]?.message}</span>
                      )}
                      {passwordStatus[user.id]?.state === "error" && (
                        <span className="tiny status-error">{passwordStatus[user.id]?.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AuthWall>
  );
}
