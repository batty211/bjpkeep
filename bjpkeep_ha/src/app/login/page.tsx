"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");

  function login() {
    if (!username.trim()) {
      alert("Please enter your name");
      return;
    }

    document.cookie = `bjpkeep-user=${encodeURIComponent(username)}; path=/; max-age=31536000`;

    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-96 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Welcome to BJP Keep</h1>

        <input
          className="mb-2 w-full rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--foreground)]"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Enter your name once. This device will remember it.
        </p>

        <button onClick={login} className="w-full rounded bg-black py-2 text-white">
          Start Using BJP Keep
        </button>
      </div>
    </div>
  );
}
