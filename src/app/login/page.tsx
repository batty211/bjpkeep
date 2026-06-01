"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function login() {
    const res = await fetch(
      "/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    if (res.ok) {
      window.location.href = "/";
      return;
    }

    alert("Login Failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-96 rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">
          BJP Keep
        </h1>

        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <input
          type="password"
          className="mb-4 w-full rounded border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={login}
          className="w-full rounded bg-black py-2 text-white"
        >
          Login
        </button>
      </div>
    </div>
  );
}