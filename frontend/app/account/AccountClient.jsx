"use client";

import { useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth } from "../../lib/api";

function Status({ state, message }) {
  if (state === "idle") return null;
  if (state === "success") return <div className="status-success">Saved</div>;
  if (state === "error") return <div className="status-error">{message || "Unable to update"}</div>;
  return <div className="status-muted">Working…</div>;
}

export default function AccountClient({ session, user }) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [initial] = useState({ name: user?.name || "", username: user?.username || "" });
  const [profileState, setProfileState] = useState("idle");
  const [profileMessage, setProfileMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordState, setPasswordState] = useState("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  const hasProfileChanges = name.trim() !== initial.name || username.trim() !== initial.username;

  const saveProfile = async () => {
    setProfileState("loading");
    setProfileMessage("");
    try {
      const res = await fetchWithAuth("/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setProfileState("error");
        setProfileMessage(payload?.detail || `Update failed (${res.status})`);
        return;
      }
      setProfileState("success");
      setProfileMessage("Profile updated");
    } catch (error) {
      setProfileState("error");
      setProfileMessage(error instanceof Error ? error.message : "Unable to update");
    }
  };

  const passwordReady = currentPassword.length >= 1 && newPassword.length >= 8;

  const updatePassword = async () => {
    setPasswordState("loading");
    setPasswordMessage("");
    try {
      const res = await fetchWithAuth("/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setPasswordState("error");
        setPasswordMessage(payload?.detail || `Update failed (${res.status})`);
        return;
      }
      setPasswordState("success");
      setPasswordMessage("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordState("error");
      setPasswordMessage(error instanceof Error ? error.message : "Unable to update password");
    }
  };

  return (
    <AuthWall
      session={session}
      title="Account"
      description="Change your display name, username, or password from one place."
    >
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="card glass stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Account</span>
            <span className="pill pill-soft">Profile</span>
          </div>
          <div className="stack" style={{ gap: "0.2rem" }}>
            <h1 style={{ margin: 0 }}>Profile</h1>
            <p className="muted tiny" style={{ margin: 0 }}>
              Update the basics. Email stays fixed for security; ask an admin to change roles.
            </p>
          </div>

          <div className="grid two-col" style={{ gap: "0.75rem" }}>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </label>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Pick a handle"
              />
            </label>
          </div>

          <div className="chip-row" style={{ gap: "0.35rem" }}>
            <button type="button" onClick={saveProfile} disabled={profileState === "loading" || !hasProfileChanges}>
              {profileState === "loading" ? "Saving…" : hasProfileChanges ? "Save profile" : "No changes"}
            </button>
            <span className="tiny muted">Email: {user?.email || "unknown"}</span>
          </div>
          <Status state={profileState} message={profileMessage} />
        </div>

        <div className="card glass stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Security</span>
            <span className="pill pill-outline">Password</span>
          </div>
          <div className="stack" style={{ gap: "0.2rem" }}>
            <h2 style={{ margin: 0 }}>Change password</h2>
            <p className="muted tiny" style={{ margin: 0 }}>
              Requires your current password. New passwords must be at least 8 characters.
            </p>
          </div>
          <div className="grid two-col" style={{ gap: "0.75rem" }}>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
              />
            </label>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
              />
            </label>
          </div>
          <div className="chip-row" style={{ gap: "0.35rem" }}>
            <button type="button" onClick={updatePassword} disabled={passwordState === "loading" || !passwordReady}>
              {passwordState === "loading" ? "Updating…" : passwordReady ? "Update password" : "Enter passwords"}
            </button>
            <span className="tiny muted">Tokens stay valid until they expire.</span>
          </div>
          <Status state={passwordState} message={passwordMessage} />
        </div>
      </section>
    </AuthWall>
  );
}
