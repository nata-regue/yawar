import { useState } from "react";

const API_URL = import.meta.env.PUBLIC_API_URL;

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();
      localStorage.setItem("yawar_token", data.access_token);
      onLogin(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-yellow-100 bg-white p-8 shadow-md dark:bg-neutral-900"
      >
        <h2 className="mb-6 text-2xl font-bold text-neutral-700 dark:text-neutral-200">
          Acceso Admin
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-bold text-neutral-800 transition hover:bg-yellow-500 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function UploadForm({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setMessage("");

    const form = new FormData();
    form.append("title", title);
    if (description) form.append("description", description);
    form.append("file", file);
    if (thumbnail) form.append("thumbnail", thumbnail);

    try {
      const res = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al subir");
      }
      setStatus("success");
      setMessage("Documento subido correctamente.");
      setTitle("");
      setDescription("");
      setFile(null);
      setThumbnail(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-12 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-700 dark:text-neutral-200">
          Subir documento
        </h1>
        <button
          onClick={onLogout}
          className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          Cerrar sesión
        </button>
      </div>

      {status === "success" && (
        <p className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
      )}
      {status === "error" && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-yellow-100 bg-white p-8 shadow-md dark:bg-neutral-900"
      >
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Descripción
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Archivo (PDF) <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            required
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
            className="w-full text-sm text-neutral-600 dark:text-neutral-300"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Miniatura (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.currentTarget.files?.[0] ?? null)}
            className="w-full text-sm text-neutral-600 dark:text-neutral-300"
          />
        </div>

        <button
          type="submit"
          disabled={status === "uploading"}
          className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-bold text-neutral-800 transition hover:bg-yellow-500 disabled:opacity-50"
        >
          {status === "uploading" ? "Subiendo..." : "Subir documento"}
        </button>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("yawar_token") : null
  );

  function handleLogout() {
    localStorage.removeItem("yawar_token");
    setToken(null);
  }

  if (!token) return <LoginForm onLogin={setToken} />;
  return <UploadForm token={token} onLogout={handleLogout} />;
}
