"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type ApiKeyRow = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type TabKey = "notifications" | "api" | "danger";

const TABS: { key: TabKey; label: string }[] = [
  { key: "notifications", label: "Notificaciones" },
  { key: "api", label: "Conexiones / API" },
  { key: "danger", label: "Zona de peligro" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? "border-accent/40 bg-accent/20"
            : "border-line bg-surface"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
            checked ? "translate-x-4 bg-accent" : "translate-x-0.5 bg-muted"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<TabKey>("notifications");

  // Notificaciones
  const [notifTournament, setNotifTournament] = useState(true);
  const [notifRound, setNotifRound] = useState(true);
  const [notifMention, setNotifMention] = useState(false);

  // API Keys
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Danger
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!user) return;
    setKeysLoading(true);
    try {
      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORKER_URL}/account/api-keys`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (res.ok) setKeys(json);
    } catch {
      /* noop */
    } finally {
      setKeysLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "api") loadKeys();
  }, [tab, loadKeys]);

  const handleRegenerate = useCallback(async () => {
    if (!user) return;
    setRegenerating(true);
    try {
      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORKER_URL}/account/api-keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Clave de perfil" }),
        },
      );
      const json = await res.json();
      if (res.ok && json.key) {
        setApiKey(json.key);
        await loadKeys();
      }
    } catch {
      /* noop */
    } finally {
      setRegenerating(false);
    }
  }, [user, loadKeys]);

  const handleSignOutAll = useCallback(async () => {
    setSigningOutAll(true);
    try {
      await signOut();
      window.location.href = "/login";
    } catch {
      setSigningOutAll(false);
    }
  }, [signOut]);

  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm("Estas seguro de que quieres borrar tu cuenta? Esta accion no se puede deshacer.")) return;
    setDeleting(true);
    try {
      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/account/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = "/";
    } catch {
      setDeleting(false);
    }
  }, []);

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
          <div className="ql-skeleton-line w-48 h-8" />
          <div className="ql-skeleton-line w-72 h-4 mt-2" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted">No has iniciado sesion.</p>
        <Link href="/login" className={buttonClasses("primary", "md")}>
          Iniciar sesion
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 animate-fadeIn">
          <Link
            href="/app/profile"
            className="metric text-[12px] text-muted hover:text-accent transition-colors"
          >
            ← Perfil
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink animate-fadeIn">
          Configuracion
        </h1>
        <p className="mt-2 text-sm text-muted animate-fadeIn">
          Gestiona tu cuenta, notificaciones y conexiones.
        </p>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-line animate-fadeIn">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-8 animate-fadeIn">
          {tab === "notifications" && (
            <Card>
              <CardBody className="p-6">
                <h2 className="text-sm font-semibold text-ink mb-4">
                  Preferencias de notificacion
                </h2>
                <div className="space-y-1">
                  <Toggle
                    checked={notifTournament}
                    onChange={setNotifTournament}
                    label="Nuevo torneo disponible"
                  />
                  <Toggle
                    checked={notifRound}
                    onChange={setNotifRound}
                    label="Resultado de ronda"
                  />
                  <Toggle
                    checked={notifMention}
                    onChange={setNotifMention}
                    label="Mencion en marketplace"
                  />
                </div>
                <p className="mt-4 text-[11px] text-muted">
                  Los cambios se guardan automaticamente en tu navegador.
                </p>
              </CardBody>
            </Card>
          )}

          {tab === "api" && (
            <div className="space-y-6">
              {/* API Key */}
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-sm font-semibold text-ink mb-4">
                    Clave de API
                  </h2>
                  <p className="text-sm text-muted mb-4">
                    Usa esta clave para conectar agentes de IA y herramientas
                    externas a QuantLab. No la compartas publicamente.
                  </p>
                  {apiKey ? (
                    <div className="rounded-lg border border-accent/40 bg-accent/[0.07] p-4">
                      <p className="text-[12px] font-medium text-accent mb-2">
                        Clave recien generada — copiala ahora
                      </p>
                      <code className="block overflow-x-auto rounded-md border border-line bg-black/40 px-3 py-2 font-mono text-sm text-ink">
                        {apiKey}
                      </code>
                    </div>
                  ) : keysLoading ? (
                    <Skeleton variant="line" className="w-full h-10" />
                  ) : !keys || keys.length === 0 ? (
                    <p className="text-sm text-muted">
                      Aun no tienes claves de API.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {keys.map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center gap-3 rounded-md border border-line bg-surface/30 px-3 py-2"
                        >
                          <code className="flex-1 font-mono text-xs text-muted truncate">
                            qlk_••••••••••••••••
                          </code>
                          <span className="metric text-[11px] text-muted">
                            {new Date(k.created_at).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className={buttonClasses("secondary", "sm") + " mt-4"}
                  >
                    {regenerating ? "Generando..." : "Regenerar clave"}
                  </button>
                </CardBody>
              </Card>

              {/* MCP Server */}
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-sm font-semibold text-ink mb-4">
                    Servidor MCP
                  </h2>
                  <p className="text-sm text-muted mb-3">
                    Conecta tu agente de IA directamente con el motor de
                    backtest de QuantLab.
                  </p>
                  <pre className="overflow-x-auto rounded-md border border-line bg-black/40 p-3 font-mono text-[12px] text-muted">
{`claude mcp add quantlab -e QUANTLAB_TOKEN=qlk_tu_clave -- python mcp_server.py`}
                  </pre>
                  <p className="mt-2 text-[11px] text-muted">
                    Guia completa en{" "}
                    <Link
                      href="/app/api-keys/instructions"
                      className="text-accent hover:underline"
                    >
                      instrucciones del servidor MCP
                    </Link>
                    .
                  </p>
                </CardBody>
              </Card>
            </div>
          )}

          {tab === "danger" && (
            <Card>
              <CardBody className="p-6">
                <h2 className="text-sm font-semibold text-ink mb-4">
                  Zona de peligro
                </h2>
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink">
                        Cerrar sesion en todos los dispositivos
                      </p>
                      <p className="text-[12px] text-muted mt-0.5">
                        Tu sesion actual tambien se cerrara.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOutAll}
                      disabled={signingOutAll}
                      className={buttonClasses("secondary", "sm")}
                    >
                      {signingOutAll ? "Cerrando..." : "Cerrar sesion"}
                    </button>
                  </div>
                  <div className="border-t border-line" />
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink">Borrar cuenta</p>
                      <p className="text-[12px] text-muted mt-0.5">
                        Esta accion es permanente e irreversible.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="rounded-md border border-short/30 bg-short/10 px-3 py-1.5 text-sm font-medium text-short transition-colors hover:bg-short/20 disabled:opacity-50"
                    >
                      {deleting ? "Borrando..." : "Borrar cuenta"}
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}