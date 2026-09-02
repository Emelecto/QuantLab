"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTournament, getLeaderboard, getMySubmission } from "@/lib/tournaments";
import type { Tournament, LeaderboardEntry, Submission } from "@/lib/tournaments";
import {
  listDatasets,
  downloadDatasetUrl,
  submitPredictions,
  myPrediction,
  getSubmission,
  mlLeaderboard,
  parsePredictionsCsv,
  mlModeLabel,
} from "@/lib/mlTournaments";
import type {
  MlDataset,
  MlSubmission,
  MlLeaderboardEntry,
  MlPredictionRow,
} from "@/lib/mlTournaments";
import { useAuth } from "@/lib/useAuth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { call } from "@/lib/tournaments";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Entrada: decide render clásico (código) vs ML (predicciones)        */
/* ------------------------------------------------------------------ */

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setTournament(await getTournament(id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-14 text-muted">Cargando...</div>;
  if (!tournament) return <div className="p-14 text-muted">Torneo no encontrado</div>;

  return tournament.type === "ml" ? (
    <MlTournamentDetail id={id} tournament={tournament} />
  ) : (
    <CodeTournamentDetail id={id} tournament={tournament} />
  );
}

/* ------------------------------------------------------------------ */
/* Torneos de código (render original, sin cambios)                    */
/* ------------------------------------------------------------------ */

function CodeTournamentDetail({
  id,
  tournament,
}: {
  id: string;
  tournament: Tournament;
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mySub, setMySub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [lb, me] = await Promise.all([getLeaderboard(id), getMySubmission(id)]);
        setLeaderboard(lb);
        setMySub(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-14 text-muted">Cargando...</div>;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {tournament.name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {tournament.asset_type} · {tournament.symbols.join(", ")} · {tournament.timeframe}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-line bg-surface px-3 py-1.5 text-sm text-muted">
              {tournament.status === "open" ? "🟢 Abierto" : tournament.status === "closed" ? "🔴 Cerrado" : tournament.status}
            </span>
            <span className="rounded border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
              {tournament.prize_pool_qp} QP
            </span>
          </div>
        </div>

        {/* Reglas */}
        {tournament.rules_text && (
          <div className="mt-6 ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink">Reglas</h2>
            <p className="mt-2 text-sm text-muted">{tournament.rules_text}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              <span>Métrica: <strong className="text-ink">{tournament.primary_metric}</strong></span>
              <span>Min trades: <strong className="text-ink">{tournament.min_trades}</strong></span>
              <span>Max slippage: <strong className="text-ink">{(tournament.max_slippage_pct * 100).toFixed(2)}%</strong></span>
            </div>
          </div>
        )}

        {/* Mi submission */}
        {mySub && (
          <div className="mt-6 ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink">Mi submission</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="text-muted">Estado: <strong className="text-ink">{mySub.status}</strong></span>
              {mySub.primary_score != null && (
                <span className="text-muted">Score: <strong className="text-accent">{mySub.primary_score.toFixed(3)}</strong></span>
              )}
              {mySub.rank != null && (
                <span className="text-muted">Rank: <strong className="text-ink">#{mySub.rank}</strong></span>
              )}
              {mySub.qp_earned > 0 && (
                <span className="text-muted">QP ganados: <strong className="text-long">+{mySub.qp_earned}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aún no hay submissions evaluadas.</p>
          ) : (
            <div className="mt-3 ql-glass ql-elev-1 overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">QP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e) => (
                    <tr key={e.user_id} className="border-b border-line/50">
                      <td className="px-4 py-3 font-mono text-ink">{e.rank}</td>
                      <td className="px-4 py-3 text-ink">
                        {e.display_name || e.username || e.user_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent">
                        {e.score.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-long">+{e.qp_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón submit */}
        {tournament.status === "open" && (
          <div className="mt-8">
            <Link
              href={`/app/tournaments/${id}/submit`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90 transition-colors"
            >
              Enviar estrategia
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-8 text-[11px] text-muted">
          QuantLab es una herramienta de investigación. No es asesoría financiera ni recomendación de inversión.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Torneos ML: Datos | Enviar | Ranking                                */
/* ------------------------------------------------------------------ */

type MlTab = "datos" | "enviar" | "ranking";

const TABS: { key: MlTab; label: string }[] = [
  { key: "datos", label: "Datos" },
  { key: "enviar", label: "Enviar" },
  { key: "ranking", label: "Ranking" },
];

const KIND_LABEL: Record<string, string> = {
  train: "Entrenamiento",
  validation: "Validación",
  live: "Ronda en vivo",
};

const ML_BADGE_CLASS = "border-[#a78bfa]/35 bg-[#a78bfa]/12 text-[#c4b5fd]";

function num(v: number | null | undefined, digits = 4): string {
  return v == null || !Number.isFinite(v) ? "—" : v.toFixed(digits);
}

function int(v: number | null | undefined): string {
  return v == null || !Number.isFinite(v) ? "—" : v.toLocaleString();
}

function MlTournamentDetail({
  id,
  tournament,
}: {
  id: string;
  tournament: Tournament;
}) {
  const [tab, setTab] = useState<MlTab>("datos");
  const [datasets, setDatasets] = useState<MlDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setDatasets(await listDatasets(id));
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar los datasets de la ronda.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const publicos = useMemo(
    () =>
      datasets
        .filter((d) => d.kind === "train" || d.kind === "validation")
        .sort(
          (a, b) =>
            (b.round_number ?? 0) - (a.round_number ?? 0) ||
            a.kind.localeCompare(b.kind),
        ),
    [datasets],
  );

  /** Dataset objetivo para enviar predicciones: live + ready. */
  const liveReady = useMemo(
    () => datasets.find((d) => d.kind === "live" && d.status === "ready") ?? null,
    [datasets],
  );
  /** Para el ranking sirve cualquier live (aunque la ronda ya esté cerrada). */
  const liveAny = useMemo(
    () => liveReady ?? datasets.find((d) => d.kind === "live") ?? null,
    [datasets, liveReady],
  );

  const modo = datasets[0]?.mode ?? null;
  const ronda = datasets.length
    ? Math.max(...datasets.map((d) => d.round_number ?? 0))
    : null;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        {/* Cabecera */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={ML_BADGE_CLASS}>Predicciones ML</Badge>
              {ronda != null && <Badge tone="neutral">Ronda {ronda}</Badge>}
              {modo && <Badge tone="neutral">{mlModeLabel(modo)}</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
              {tournament.name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sube un CSV <span className="text-ink">id,prediction</span> y compite por la
              correlación media entre eras.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-line bg-surface px-3 py-1.5 text-sm text-muted">
              {tournament.status === "open"
                ? "🟢 Abierto"
                : tournament.status === "closed"
                  ? "🔴 Cerrado"
                  : tournament.status}
            </span>
            <span className="rounded border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
              {tournament.prize_pool_qp} QP
            </span>
          </div>
        </div>

        {/* Reglas */}
        {tournament.rules_text && (
          <div className="mt-6 ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink">Reglas</h2>
            <p className="mt-2 text-sm text-muted">{tournament.rules_text}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              <span>
                Métrica: <strong className="text-ink">{tournament.primary_metric}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div
          role="tablist"
          aria-label="Secciones del torneo ML"
          className="mt-8 grid grid-cols-3 gap-2 rounded-lg bg-surface/60 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={
                "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (tab === t.key ? "bg-accent text-bg" : "text-muted hover:text-ink")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-short/30 bg-short/10 px-4 py-3 text-sm text-short">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="ql-skeleton-card h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {tab === "datos" && <TabDatos datasets={publicos} />}
            {tab === "enviar" && <TabEnviar liveDataset={liveReady} />}
            {tab === "ranking" && <TabRanking dataset={liveAny} />}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-10 text-[11px] text-muted">
          QuantLab es una herramienta de investigación. No es asesoría financiera ni
          recomendación de inversión.
        </p>
      </div>
    </main>
  );
}

/* --------------------------- Pestaña: Datos --------------------------- */

function TabDatos({ datasets }: { datasets: MlDataset[] }) {
  const [bajando, setBajando] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const descargar = useCallback(
    async (ds: MlDataset) => {
      if (ds.kind !== "train" && ds.kind !== "validation") return;
      setErr(null);
      setBajando(ds.id);
      try {
        // El endpoint /download resuelve la URL firmada/pública; download_url
        // del listado sirve de respaldo cuando ya viene resuelta.
        let url: string;
        try {
          url = await downloadDatasetUrl(ds.id, ds.kind);
        } catch (e) {
          if (!ds.download_url) throw e;
          url = ds.download_url;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: any) {
        setErr(e?.message || "No se pudo obtener el archivo.");
      } finally {
        setBajando(null);
      }
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {err && (
        <div className="rounded-md border border-short/30 bg-short/10 px-4 py-3 text-sm text-short">
          {err}
        </div>
      )}

      {datasets.length === 0 ? (
        <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center text-sm text-muted">
          Todavía no hay datasets publicados para esta ronda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {datasets.map((ds) => (
            <div key={ds.id} className="ql-glass ql-elev-1 flex flex-col rounded-xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    {KIND_LABEL[ds.kind] ?? ds.kind}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Ronda {ds.round_number} · {ds.kind}.parquet
                  </p>
                </div>
                <Badge
                  className={ds.mode === "real" ? undefined : ML_BADGE_CLASS}
                  tone={ds.mode === "real" ? "long" : undefined}
                >
                  {mlModeLabel(ds.mode)}
                </Badge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="uppercase tracking-wider text-muted">Activos</dt>
                  <dd className="metric text-ink">{int(ds.n_assets)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted">Eras</dt>
                  <dd className="metric text-ink">{int(ds.n_eras)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted">Features</dt>
                  <dd className="metric text-ink">{int(ds.n_features)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted">Filas</dt>
                  <dd className="metric text-ink">{int(ds.row_count)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => descargar(ds)}
                  disabled={bajando === ds.id}
                  className={buttonClasses("primary", "sm")}
                >
                  {bajando === ds.id ? "Obteniendo..." : `Descargar ${ds.kind}.parquet`}
                </button>
                <span className="text-[11px] text-muted">{ds.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Punto 4: notebook de ejemplo */}
      <div className="ql-glass ql-elev-1 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ink">¿Primera vez?</h3>
        <p className="mt-2 text-sm text-muted">
          El notebook de ejemplo descarga train/validation, entrena un modelo pequeño sobre
          las features <span className="text-ink">feature_XX</span> y genera el CSV{" "}
          <span className="text-ink">id,prediction</span> listo para enviar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="https://colab.research.google.com/github/Emelecto/QuantLab/blob/main/web/public/ml/ejemplo_quantlab.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "sm")}
          >
            Abrir en Colab
          </a>
          <a
            href="/ml/ejemplo_quantlab.ipynb"
            download
            className={buttonClasses("secondary", "sm")}
          >
            Descargar .ipynb
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- Pestaña: Enviar -------------------------- */

function TabEnviar({ liveDataset }: { liveDataset: MlDataset | null }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<MlPredictionRow[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [mine, setMine] = useState<MlSubmission | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const datasetId = liveDataset?.id ?? null;

  const recargarMio = useCallback(async () => {
    if (!datasetId) return;
    setMine(await myPrediction(datasetId));
  }, [datasetId]);

  useEffect(() => {
    void recargarMio();
  }, [recargarMio]);

  // Polling de estado cuando hay una submission en procesamiento
  useEffect(() => {
    if (!pollingId) return;
    let alive = true;
    const poll = async () => {
      try {
        const s = await getSubmission(pollingId);
        if (!alive || !s) return;
        if (s.status === "pending") {
          // Disparar evaluación bajo demanda
          try {
            await call(`/ml/submissions/${pollingId}/evaluate`, { method: "POST" });
          } catch {
            // Error manejado abajo con el estado
          }
        }
        if (s.status === "scored" || s.status === "error" || s.status === "disqualified") {
          setPollingId(null);
          setMine({
            id: s.id,
            row_count: s.row_count,
            status: s.status,
            score: s.score,
            corr_mean: s.corr_mean,
            fnc_mean: s.fnc_mean,
            consistencia: s.consistencia,
            meta_corr: s.meta_corr,
            is_valid: s.is_valid,
            plagio_flag: s.plagio_flag,
            submitted_at: s.submitted_at,
            scored_at: s.scored_at,
          });
          if (s.status === "error") {
            setFeedback({ type: "err", msg: `Error al evaluar: ${s.eval_error || "error desconocido"}` });
          } else if (s.status === "disqualified") {
            setFeedback({ type: "err", msg: "Tu submission fue descalificada (datos inválidos o insuficientes)." });
          } else {
            setFeedback({ type: "ok", msg: `¡Evaluación completa! Score: ${s.score?.toFixed(4) ?? "—"}` });
          }
        }
      } catch {
        // Silencioso: reintentará
      }
    };
    const interval = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [pollingId]);

  const cargarArchivo = useCallback(async (file: File) => {
    setFeedback(null);
    setRows(null);
    setFileName(file.name);
    if (!/\.csv$/i.test(file.name)) {
      setFeedback({ type: "err", msg: "El archivo debe ser un .csv" });
      return;
    }
    const texto = await file.text();
    const { rows: parsed, error } = parsePredictionsCsv(texto);
    if (error) {
      setFeedback({ type: "err", msg: error });
      return;
    }
    setRows(parsed);
    setFeedback({
      type: "ok",
      msg: `${parsed.length.toLocaleString()} predicciones válidas listas para enviar.`,
    });
  }, []);

  async function enviar() {
    if (!datasetId || !rows) return;
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await submitPredictions(datasetId, rows);
      // El worker ahora devuelve el resultado completo en la misma respuesta
      if (res.submission) {
        const s = res.submission;
        setMine({
          id: s.id,
          row_count: s.row_count,
          status: s.status,
          score: s.score,
          corr_mean: s.corr_mean,
          fnc_mean: s.fnc_mean,
          consistencia: s.consistencia,
          meta_corr: s.meta_corr,
          is_valid: s.is_valid,
          plagio_flag: s.plagio_flag,
          submitted_at: s.submitted_at,
          scored_at: s.scored_at,
        });
        if (s.status === "error") {
          setFeedback({ type: "err", msg: `Error al evaluar: ${s.eval_error || "error desconocido"}` });
        } else if (s.status === "disqualified") {
          setFeedback({ type: "err", msg: "Tu submission fue descalificada (datos inválidos o insuficientes)." });
        } else {
          setFeedback({ type: "ok", msg: `¡Evaluación completa! Score: ${s.score?.toFixed(4) ?? "—"}` });
        }
      } else if (res.status === "processing") {
        // Fallback: si sigue en processing, iniciar polling
        setPollingId(res.id);
        setFeedback({
          type: "ok",
          msg: "Recibimos tus predicciones. Evaluando...",
        });
      }
      setRows(null);
    } catch (e: any) {
      const code = e?.code;
      let msg = e?.message || "Error al enviar las predicciones.";
      if (code === "WORKER_UNAVAILABLE") {
        msg = "El servidor de predicciones no está disponible temporalmente. Reintentá en unos minutos.";
      } else if (code === "WORKER_TIMEOUT") {
        msg = "El envío tardó demasiado. Probá con un archivo más chico o reintentá.";
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        msg = "Sin conexión al server. Verificá tu internet.";
      }
      setFeedback({ type: "err", msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!datasetId ? (
        <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center text-sm text-muted">
          No hay una ronda abierta para recibir predicciones ahora mismo.
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void cargarArchivo(f);
            }}
            className={
              "ql-glass ql-elev-1 rounded-xl border-dashed px-6 py-10 text-center transition-colors " +
              (dragging ? "border-accent bg-accent/5" : "border-line")
            }
          >
            <p className="text-sm text-ink">Arrastra aquí tu predictions.csv</p>
            <p className="mt-1 text-xs text-muted">
              Columnas obligatorias: <span className="text-ink">id</span> y{" "}
              <span className="text-ink">prediction</span> (numérica, sin nulos).
            </p>
            <label className={buttonClasses("secondary", "sm", "mt-4 cursor-pointer")}>
              Seleccionar archivo
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void cargarArchivo(f);
                }}
              />
            </label>
            {fileName && (
              <p className="mt-3 text-xs text-muted">
                Archivo: <span className="text-ink">{fileName}</span>
              </p>
            )}
          </div>

          {feedback && (
            <div
              className={
                "rounded-md px-4 py-3 text-sm " +
                (feedback.type === "ok"
                  ? "border border-long/30 bg-long/10 text-long"
                  : "border border-short/30 bg-short/10 text-short")
              }
            >
              {feedback.msg}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={enviar}
              disabled={!rows || enviando}
              className={buttonClasses("primary", "md")}
            >
              {enviando ? "Enviando..." : "Enviar predicciones"}
            </button>
            <p className="mt-2 text-[11px] text-muted">
              Un envío nuevo reemplaza el anterior de esta ronda.
            </p>
          </div>
        </>
      )}

      {/* Mi envío */}
      {mine && (
        <div className="ql-glass ql-elev-1 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Mi envío</h3>
            {mine.plagio_flag && <Badge tone="short">Plagio detectado</Badge>}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="uppercase tracking-wider text-muted">Estado</dt>
              <dd className="text-ink">{mine.status}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-muted">Score</dt>
              <dd className="metric text-accent">{num(mine.score, 4)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-muted">Corr media</dt>
              <dd className="metric text-ink">{num(mine.corr_mean, 4)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-muted">FNC media</dt>
              <dd className="metric text-ink">{num(mine.fnc_mean, 4)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-muted">
            {int(mine.row_count)} filas
            {mine.submitted_at
              ? ` · enviado ${new Date(mine.submitted_at).toLocaleString("es")}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------- Pestaña: Ranking ------------------------- */

function TabRanking({ dataset }: { dataset: MlDataset | null }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<MlLeaderboardEntry[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const datasetId = dataset?.id ?? null;

  useEffect(() => {
    if (!datasetId) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const lb = await mlLeaderboard(datasetId);
        if (!alive) return;
        setRows(lb);

        // Nombres visibles desde `profiles`; si falla, se usa el id recortado.
        const ids = Array.from(new Set(lb.map((e) => e.user_id).filter(Boolean)));
        if (ids.length === 0) return;
        try {
          const supabase = createBrowserSupabaseClient();
          let data: any[] | null = null;
          const primero = await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", ids);
          if (primero.error) {
            const segundo = await supabase
              .from("profiles")
              .select("id, username")
              .in("id", ids);
            data = segundo.data ?? null;
          } else {
            data = primero.data ?? null;
          }
          if (!alive || !data) return;
          const map: Record<string, string> = {};
          for (const p of data) {
            const nombre = p.display_name || p.username;
            if (p.id && nombre) map[p.id] = nombre;
          }
          setNombres(map);
        } catch {
          /* sin perfiles: fallback al id recortado */
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || "No se pudo cargar el ranking.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [datasetId]);

  if (!datasetId) {
    return (
      <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center text-sm text-muted">
        Esta ronda todavía no tiene ranking.
      </div>
    );
  }

  if (loading) return <div className="ql-skeleton-card h-40 rounded-xl" />;

  if (err) {
    return (
      <div className="rounded-md border border-short/30 bg-short/10 px-4 py-3 text-sm text-short">
        {err}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center text-sm text-muted">
        Aún no hay envíos evaluados en esta ronda.
      </div>
    );
  }

  return (
    <div className="ql-glass ql-elev-1 overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3 text-right">Corr</th>
              <th className="px-4 py-3 text-right">FNC</th>
              <th className="px-4 py-3 text-right">Consistencia</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">QP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const esMio = !!user && e.user_id === user.id;
              return (
                <tr
                  key={`${e.user_id}-${i}`}
                  className={
                    "border-b border-line/50 " +
                    (esMio ? "bg-accent/10 text-ink" : "")
                  }
                >
                  <td className="px-4 py-3 font-mono text-ink">{i + 1}</td>
                  <td className="px-4 py-3 text-ink">
                    <span className="inline-flex items-center gap-2">
                      {nombres[e.user_id] || e.user_id.slice(0, 8)}
                      {esMio && <Badge tone="cyan">tú</Badge>}
                      {e.plagio_flag && <Badge tone="short">plagio</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {num(e.corr_mean, 4)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {num(e.fnc_mean, 4)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {num(e.consistencia, 3)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent">
                    {num(e.score, 4)}
                  </td>
                  <td className="px-4 py-3 text-right text-long">
                    {e.qp_earned != null ? `+${e.qp_earned}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
