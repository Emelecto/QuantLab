/**
 * Cliente de torneos ML de predicciones (estilo Numerai) para QuantLab.
 *
 * Consume los endpoints `/ml/...` del Worker FastAPI (worker/ml_endpoints.py).
 * Reutiliza el helper `call` de `@/lib/tournaments`, que ya inyecta el Bearer
 * del token de sesión de Supabase y hace anti-cache.
 */
import { call } from "@/lib/tournaments";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** Origen de los datos de la ronda. */
export type MlMode = "sintetico" | "real";

/** Rol del dataset dentro de la ronda. `live` nunca expone su parquet. */
export type MlDatasetKind = "train" | "validation" | "live";

export interface MlDataset {
  id: string;
  tournament_id: string;
  round_number: number;
  mode: MlMode;
  kind: MlDatasetKind;
  status: string;
  n_assets: number;
  n_eras: number;
  n_features: number;
  row_count: number;
  feature_cols: string[] | null;
  closes_at: string | null;
  /** Solo train/validation. `null` para live (y cuando el worker no lo resuelve). */
  download_url: string | null;
}

export interface MlSubmission {
  id: string;
  row_count: number;
  status: string;
  score: number | null;
  corr_mean: number | null;
  fnc_mean: number | null;
  consistencia: number | null;
  meta_corr: number | null;
  is_valid: boolean | null;
  plagio_flag: boolean | null;
  submitted_at: string | null;
  scored_at: string | null;
  eval_error?: string | null;
}

export interface MlLeaderboardEntry {
  user_id: string;
  score: number | null;
  corr_mean: number | null;
  fnc_mean: number | null;
  consistencia: number | null;
  is_valid: boolean | null;
  plagio_flag: boolean | null;
  submitted_at: string | null;
  /** El worker aún no reparte QP por ronda ML; queda opcional. */
  qp_earned?: number | null;
}

/** Fila de predicción tal como la acepta el worker en modo JSON. */
export interface MlPredictionRow {
  id: string;
  prediction: number;
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

/**
 * Datasets de una ronda ML.
 *
 * El worker declara el filtro de ronda como `round_number`; se envían ambos
 * nombres (`round_number` y `round`) porque FastAPI ignora los extra y así el
 * filtro funciona con cualquiera de las dos firmas.
 */
export async function listDatasets(
  tournamentId?: string,
  round?: number,
): Promise<MlDataset[]> {
  const q = new URLSearchParams();
  if (tournamentId) q.set("tournament_id", tournamentId);
  if (round != null && Number.isFinite(round)) {
    q.set("round_number", String(round));
    q.set("round", String(round));
  }
  const qs = q.toString();
  const res = await call<{ datasets?: MlDataset[] }>(
    `/ml/datasets${qs ? `?${qs}` : ""}`,
  );
  return Array.isArray(res?.datasets) ? res.datasets : [];
}

/** URL pública (Storage) del parquet de un dataset train/validation. */
export async function downloadDatasetUrl(
  datasetId: string,
  kind: "train" | "validation",
): Promise<string> {
  const res = await call<{ url?: string }>(
    `/ml/datasets/${datasetId}/download?kind=${kind}`,
  );
  if (!res?.url) throw new Error("El worker no devolvió una URL de descarga.");
  return res.url;
}

/**
 * Envía predicciones al dataset `live` de la ronda.
 *
 * Se usa el modo JSON `{ rows }` (el CSV se parsea en el cliente) para poder
 * reutilizar `call` sin construir un FormData.
 */
export async function submitPredictions(
  datasetId: string,
  rows: MlPredictionRow[],
): Promise<{ id: string; row_count: number; status: string; submission?: MlSubmission }> {
  return call<{ id: string; row_count: number; status: string; submission?: MlSubmission }>(
    `/ml/datasets/${datasetId}/predictions`,
    { method: "POST", body: JSON.stringify({ rows }) },
  );
}

/** Mi envío para una ronda, o `null` si aún no envié nada. */
export async function myPrediction(
  datasetId: string,
): Promise<MlSubmission | null> {
  try {
    const res = await call<{ submission?: MlSubmission | null }>(
      `/ml/predictions/mine?dataset_id=${encodeURIComponent(datasetId)}`,
    );
    return res?.submission ?? null;
  } catch {
    return null;
  }
}

/** Estado de una submission propia (para polling). */
export async function getSubmission(
  submissionId: string,
): Promise<MlSubmission | null> {
  try {
    const res = await call<{ submission?: MlSubmission | null }>(
      `/ml/submissions/${encodeURIComponent(submissionId)}`,
    );
    return res?.submission ?? null;
  } catch {
    return null;
  }
}

/** Ranking de la ronda (solo envíos válidos, ordenado por score). */
export async function mlLeaderboard(
  datasetId: string,
): Promise<MlLeaderboardEntry[]> {
  const res = await call<{ leaderboard?: MlLeaderboardEntry[] }>(
    `/ml/leaderboard?dataset_id=${encodeURIComponent(datasetId)}`,
  );
  return Array.isArray(res?.leaderboard) ? res.leaderboard : [];
}

/* ------------------------------------------------------------------ */
/* Utilidades de cliente                                              */
/* ------------------------------------------------------------------ */

export interface CsvParseResult {
  rows: MlPredictionRow[];
  error: string | null;
}

/**
 * Parsea y valida un CSV `id,prediction` en el navegador.
 *
 * Aplica las mismas reglas que `_validar_csv` del worker: columnas `id` y
 * `prediction`, predicciones numéricas, sin nulos y al menos una fila.
 */
export function parsePredictionsCsv(text: string): CsvParseResult {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return { rows: [], error: "El archivo está vacío." };

  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      error: "El CSV necesita una cabecera y al menos una fila de datos.",
    };
  }

  const split = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const idIdx = header.indexOf("id");
  const predIdx = header.indexOf("prediction");
  if (idIdx === -1 || predIdx === -1) {
    return {
      rows: [],
      error: "El CSV debe tener columnas 'id' y 'prediction'.",
    };
  }

  const rows: MlPredictionRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    const id = cells[idIdx];
    const raw = cells[predIdx];
    if (!id) {
      return { rows: [], error: `Fila ${i + 1}: 'id' vacío.` };
    }
    if (raw == null || raw === "") {
      return { rows: [], error: `Fila ${i + 1}: 'prediction' vacío (NaN).` };
    }
    const prediction = Number(raw);
    if (!Number.isFinite(prediction)) {
      return {
        rows: [],
        error: `Fila ${i + 1}: 'prediction' no es numérico ("${raw}").`,
      };
    }
    rows.push({ id, prediction });
  }

  if (rows.length === 0) {
    return { rows: [], error: "No hay filas de predicciones." };
  }
  return { rows, error: null };
}

/** Etiqueta en español del modo de la ronda. */
export function mlModeLabel(mode: MlMode | string | null | undefined): string {
  return mode === "real" ? "datos reales" : "sintético";
}
