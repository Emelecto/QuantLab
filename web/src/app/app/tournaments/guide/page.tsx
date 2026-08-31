"use client";

import Link from "next/link";

export default function TournamentsGuidePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Guía de Torneos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Todo lo que necesitas saber sobre cómo funcionan los torneos de
            QuantLab: desde los datasets hasta las predicciones, los submits,
            la evaluación y el MCP.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
        <div className="prose prose-invert max-w-none">
          {/* ¿Qué son los torneos? */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">¿Qué son los torneos?</h2>
            <p className="text-sm leading-relaxed text-muted mb-4">
              Los torneos son competiciones periódicas donde los participantes
              envían predicciones sobre el comportamiento de mercados financieros.
              A diferencia de torneos de trading tradicionales, aquí no se ejecuta
              dinero real: compites con puntos virtuales (QP) y tus habilidades
              de modelado.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Cada torneo tiene una <strong className="text-ink">bolsa de QP</strong>{" "}
              que se reparte entre los mejores participantes según su posición en el
              ranking final.
            </p>
          </div>

          {/* Tipos de torneos */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Tipos de torneos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-line/50 p-4">
                <h3 className="text-sm font-semibold text-accent mb-2">Predicciones ML</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Torneos estilo Numerai. Recibes un dataset con datos históricos de
                  múltiples activos y debes predecir el retorno futuro de cada uno.
                  Tu submission es una fila de predicciones normalizadas.
                </p>
              </div>
              <div className="rounded-lg border border-line/50 p-4">
                <h3 className="text-sm font-semibold text-accent mb-2">Estrategias</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Torneos de trading algorítmico. Diseña una estrategia que genere
                  señales de compra/venta y envía los resultados de tu backtest. Se
                  evalúa el rendimiento fuera de muestra (OOS).
                </p>
              </div>
            </div>
          </div>

          {/* Los Datasets */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Los Datasets</h2>
            
            <h3 className="text-sm font-semibold text-ink mb-2">¿De dónde vienen los datos?</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              Los datasets se generan automáticamente antes de cada ronda del torneo.
              Pueden ser de dos tipos:
            </p>
            <ul className="text-sm text-muted space-y-2 mb-4 list-disc pl-5">
              <li>
                <strong className="text-ink">Datos sintéticos:</strong> Mercados
                simulados con propiedades estadísticas realistas (correlaciones,
                distribuciones de retorno, volatilidad variable).
              </li>
              <li>
                <strong className="text-ink">Datos reales:</strong> Información
                histórica de mercados reales (acciones, cripto, forex) obtenida de
                fuentes como Yahoo Finance y Binance.
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-ink mb-2">Estructura del dataset</h3>
            <p className="text-sm leading-relaxed text-muted mb-3">
              Cada dataset contiene tres particiones:
            </p>
            <div className="overflow-x-auto rounded-lg border border-line/50 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-line/20">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Partición</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Uso</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Train</td>
                    <td className="px-4 py-2">Entrenar tu modelo</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Validation</td>
                    <td className="px-4 py-2">Ajustar hiperparámetros y validar localmente</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Live</td>
                    <td className="px-4 py-2">Generar predicciones para enviar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-semibold text-ink mb-2">Obtención del dataset</h3>
            <p className="text-sm leading-relaxed text-muted">
              Los datasets se descargan desde Supabase Storage (bucket
              <code className="font-mono text-accent text-xs">tournament-datasets</code>).
              El worker expone endpoints para listar y descargar las particiones
              disponibles de cada ronda activa.
            </p>
          </div>

          {/* Las Predicciones */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Las Predicciones</h2>
            
            <h3 className="text-sm font-semibold text-ink mb-2">¿Cómo se hacen predicciones?</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              Una vez entrenado tu modelo con la partición de train y validado con
              validation, usas el modelo final para generar predicciones sobre la
              partición live. El proceso general es:
            </p>
            <ol className="text-sm text-muted space-y-2 mb-4 list-decimal pl-5">
              <li>Descarga el dataset del torneo (train + validation)</li>
              <li>Entrena tu modelo (XGBoost, LightGBM, redes neuronales, etc.)</li>
              <li>Valida localmente con la partición de validation</li>
              <li>Genera predicciones para la partición live</li>
              <li>Formatea las predicciones como un CSV con el formato requerido</li>
              <li>Envía tu submission antes del cierre del torneo</li>
            </ol>

            <h3 className="text-sm font-semibold text-ink mb-2">Formato del CSV de predicciones</h3>
            <p className="text-sm leading-relaxed text-muted mb-3">
              Para torneos de predicciones ML, el CSV debe contener al menos:
            </p>
            <ul className="text-sm text-muted space-y-1 mb-4 list-disc pl-5">
              <li>Una columna <code className="font-mono text-accent text-xs">activo_id</code> identificando cada activo</li>
              <li>Una columna <code className="font-mono text-accent text-xs">prediccion</code> con tu predicción normalizada (ej: entre -1 y 1)</li>
            </ul>
            <p className="text-sm text-muted">
              Para torneos de estrategias, el CSV incluye las señales generadas
              por tu estrategia en el período de evaluación.
            </p>
          </div>

          {/* El Submit */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">El Submit (Envío)</h2>
            
            <h3 className="text-sm font-semibold text-ink mb-2">¿Cómo se envía una predicción?</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              El envío se hace a través del endpoint{" "}
              <code className="font-mono text-accent text-xs">POST /datasets/{'{dataset_id}'}/predictions</code>{" "}
              del worker. Tienes dos opciones:
            </p>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div className="rounded-lg border border-line/50 p-4">
                <h4 className="text-sm font-semibold text-ink mb-2">1. Subir CSV</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Adjunta un archivo CSV directamente en el request como{" "}
                  <code className="font-mono">multipart/form-data</code>.
                </p>
              </div>
              <div className="rounded-lg border border-line/50 p-4">
                <h4 className="text-sm font-semibold text-ink mb-2">2. JSON inline</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Envía un body JSON con la clave{" "}
                  <code className="font-mono">rows</code> conteniendo un array de
                  predicciones.
                </p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-ink mb-2">Reemplazo de submissions</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              Si ya enviaste una submission previamente, el nuevo envío{" "}
              <strong className="text-ink">reemplaza</strong> al anterior. Solo se
              evalúa la última submission recibida antes del cierre.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">Validación del CSV</h3>
            <p className="text-sm leading-relaxed text-muted">
              El worker valida automáticamente que el CSV tenga las columnas
              requeridas, el número correcto de filas y que los valores sean
              coherentes. Si hay errores, recibirás un HTTP 422 con la descripción
              del problema.
            </p>
          </div>

          {/* Evaluación */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Evaluación y Scoring</h2>
            
            <h3 className="text-sm font-semibold text-ink mb-2">¿Cómo se evalúan las submissions?</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              Una vez cerrado el torneo, el worker ejecuta el proceso de scoring
              automáticamente:
            </p>
            <ol className="text-sm text-muted space-y-2 mb-4 list-decimal pl-5">
              <li>Descarga todas las submissions válidas</li>
              <li>Compara cada predicción contra los valores reales (holdout)</li>
              <li>Calcula métricas de rendimiento por participante</li>
              <li>Genera el ranking final</li>
              <li>Reparte la bolsa de QP según la posición</li>
            </ol>

            <h3 className="text-sm font-semibold text-ink mb-2">Métricas de evaluación</h3>
            <p className="text-sm leading-relaxed text-muted mb-3">
              Las métricas principales son:
            </p>
            <div className="overflow-x-auto rounded-lg border border-line/50 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-line/20">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Métrica</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Descripción</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Correlación (corr_mean)</td>
                    <td className="px-4 py-2">Correlación media de tus predicciones con los retornos reales</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">FNC (Feature Neutral Correlation)</td>
                    <td className="px-4 py-2">Correlación neutralizada por features, para evitar sesgos</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Consistencia</td>
                    <td className="px-4 py-2">Estabilidad de tu rendimiento a lo largo de las eras</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium">Score final</td>
                    <td className="px-4 py-2">Puntuación ponderada que determina tu posición</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-semibold text-ink mb-2">Anti-trampas</h3>
            <p className="text-sm leading-relaxed text-muted">
              El sistema incluye detección de plagio (comparación entre submissions)
              y penalizaciones por overfitting. El{" "}
              <strong className="text-ink">Deflated Sharpe OOS</strong> ajusta el
              Sharpe ratio por el número de intentos, desincentivando el data
              snooping.
            </p>
          </div>

          {/* Reparto de QP */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Reparto de QP</h2>
            <p className="text-sm leading-relaxed text-muted mb-4">
              La bolsa de QP del torneo se reparte entre los mejores participantes.
              El reparto es proporcional a la puntuación obtenida: cuanto mayor
              sea tu score, más QP recibes.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Los QP se acreditan automáticamente en tu wallet una vez finalizado
              el scoring. Puedes usarlos para participar en más torneos o por
              servicios en el marketplace.
            </p>
          </div>

          {/* Uso del MCP */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Uso del MCP (Model Context Protocol)</h2>
            
            <h3 className="text-sm font-semibold text-ink mb-2">¿Qué es el MCP?</h3>
            <p className="text-sm leading-relaxed text-muted mb-4">
              El MCP es un servidor que permite a tu agente de IA (Claude Code,
              Cursor, Codex CLI) interactuar con QuantLab usando lenguaje natural.
              No necesitas escribir código: dile a tu agente lo que quieres hacer
              y él usa las herramientas disponibles.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">Tools disponibles</h3>
            <div className="overflow-x-auto rounded-lg border border-line/50 mb-4">
              <table className="w-full text-sm">
                <thead className="bg-line/20">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Tool</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Auth</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-ink">Descripción</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">list_tournaments</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">Lista torneos abiertos</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">get_leaderboard</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">Ranking de un torneo</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">list_marketplace</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">Estrategias publicadas</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">get_qp_balance</td>
                    <td className="px-4 py-2">✅</td>
                    <td className="px-4 py-2">Tu balance QP</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">get_my_submission</td>
                    <td className="px-4 py-2">✅</td>
                    <td className="px-4 py-2">Tu submission en un torneo</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">submit_strategy</td>
                    <td className="px-4 py-2">✅</td>
                    <td className="px-4 py-2">Enviar estrategia a un torneo</td>
                  </tr>
                  <tr className="border-t border-line/30">
                    <td className="px-4 py-2 font-medium text-xs">subscribe_strategy</td>
                    <td className="px-4 py-2">✅</td>
                    <td className="px-4 py-2">Suscribirse a una estrategia</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-semibold text-ink mb-2">Ejemplos de uso</h3>
            <pre className="rounded-md border border-line bg-black/40 p-3 font-mono text-[12px] text-muted overflow-x-auto">
{`- "¿En qué torneos puedo participar?"
- "Muéstrame el leaderboard del torneo de BTC"
- "¿Cuántos QP tengo?"
- "Envía mi estrategia fast=20 slow=50 al torneo X"
- "¿Qué estrategias hay en el marketplace? Suscríbeme a la más barata"`}
            </pre>
          </div>

          {/* Endpoints del Worker */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Endpoints del Worker</h2>
            <p className="text-sm leading-relaxed text-muted mb-4">
              El worker de QuantLab expone los siguientes endpoints relevantes para
              torneos:
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">GET /tournament/list</code>
                <p className="text-xs text-muted mt-1">Lista torneos abiertos con filtros opcionales</p>
              </div>
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">GET /tournament/{"{id}"}</code>
                <p className="text-xs text-muted mt-1">Detalle de un torneo específico</p>
              </div>
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">GET /datasets/{"{dataset_id}"}</code>
                <p className="text-xs text-muted mt-1">Info del dataset y URLs de descarga</p>
              </div>
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">POST /datasets/{"{dataset_id}"}/predictions</code>
                <p className="text-xs text-muted mt-1">Enviar predicciones (CSV o JSON)</p>
              </div>
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">GET /predictions/mine?dataset_id={"{id}"}</code>
                <p className="text-xs text-muted mt-1">Consultar tu submission actual</p>
              </div>
              <div className="rounded-lg border border-line/50 p-3">
                <code className="text-xs font-mono text-accent">GET /leaderboard?dataset_id={"{id}"}</code>
                <p className="text-xs text-muted mt-1">Ranking de la ronda</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="ql-glass ql-elev-1 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-ink mb-2">¿Listo para competir?</h3>
            <p className="text-sm text-muted mb-4">
              Explora los torneos activos y envía tu primera predicción.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/app/tournaments"
                className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent/90"
              >
                Ver torneos activos
              </Link>
              <Link
                href="/app/api-keys"
                className="inline-flex items-center justify-center rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/20"
              >
                Configurar MCP
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
