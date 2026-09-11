// fetch con timeout + reintento visible para el worker de Render.
//
// El plan free/starter duerme el worker tras inactividad: la primera
// petición tarda ~50 s o responde 502/503/504 (cold start). Este helper
// reintenta con backoff exponencial y avisa a la UI vía onAttempt para que
// muestre "Despertando worker…".
//
// Sin dependencias, solo fetch + AbortController. Español con ñ/tildes en
// los mensajes que construya el llamador (aquí solo números).

export interface WakeRetryOptions {
  /** Timeout por intento en ms. Por defecto 55_000 (cold start ~50 s). */
  timeoutMs?: number;
  /** Nº máximo de intentos. Por defecto 3. */
  maxAttempts?: number;
  /** Base del backoff: espera baseDelayMs * 2^(intento-1) entre intentos. */
  baseDelayMs?: number;
  /** Estados HTTP reintentables. Por defecto [502, 503, 504, 429]. */
  retryStatuses?: number[];
  /** Callback por intento (1-indexed) para UI visible. */
  onAttempt?: (attempt: number, maxAttempts: number) => void;
}

const DEFAULT_RETRY_STATUSES = [502, 503, 504, 429];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * fetch con timeout por intento (AbortController) + reintento con backoff
 * exponencial ante fallos de red/aborto/timeout y HTTP 502/503/504/429.
 * Devuelve la última Response (aunque sea error) para que el llamador
 * decida el mensaje; solo lanza si TODOS los intentos fallaron por red.
 */
export async function fetchWithWakeRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: WakeRetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 55_000;
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 2_000;
  const retryStatuses = opts.retryStatuses ?? DEFAULT_RETRY_STATUSES;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    opts.onAttempt?.(attempt, maxAttempts);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(input, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      // Éxito o error NO reintentable → devolver tal cual.
      if (res.ok || !retryStatuses.includes(res.status) || attempt === maxAttempts) {
        return res;
      }
      // Error reintentable y quedan intentos → backoff y seguir.
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt === maxAttempts) throw err;
      // Fallo de red/aborto/timeout → backoff y seguir.
    }
    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  // Inalcanzable en la práctica (el bucle devuelve o lanza), pero TS lo exige.
  throw lastError instanceof Error
    ? lastError
    : new Error("fetchWithWakeRetry: sin intentos disponibles");
}
