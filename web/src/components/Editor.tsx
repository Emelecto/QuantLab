"use client";

import Editor, { type BeforeMount, type OnChange } from "@monaco-editor/react";

/** Plantilla por defecto: cruce de medias móviles (SMA crossover) en Python. */
export const DEFAULT_STRATEGY_CODE = `# Estrategia SMA Crossover (cruce de medias móviles)
# Compra cuando la media rápida cruza por encima de la lenta.
# Vende (pasa a fuera de mercado) cuando cruza por debajo.

def indicator(data):
    # data: DataFrame con columna 'close'
    fast = data["close"].rolling(20).mean()   # SMA corta (20 velas)
    slow = data["close"].rolling(50).mean()   # SMA larga (50 velas)
    return fast, slow

def signal(fast, slow):
    # 1 = long (dentro del mercado), 0 = fuera
    return (fast > slow).astype(int)

# El motor evalúa esta señal en walk-forward (IS / OOS)
# para medir la integridad real de la estrategia.
`;

/**
 * Editor Monaco con tema oscuro QuantLab ('quantlab-dark').
 * Se carga solo en el cliente (loader CDN de @monaco-editor/react).
 */
export function StrategyEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("quantlab-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a0c10",
        "editor.foreground": "#eef2f7",
        "editorCursor.foreground": "#5eead4",
        "editor.lineHighlightBackground": "#11151c",
        "editorLineNumber.foreground": "#8b93a7",
        "editorLineNumber.activeForeground": "#5eead4",
        "editor.selectionBackground": "#1f6f68",
        "editorGutter.background": "#0a0c10",
        "editorIndentGuide.background1": "#1b2230",
      },
    });
  };

  const handleChange: OnChange = (v) => onChange(v ?? "");

  return (
    <Editor
      height="480px"
      language="python"
      theme="quantlab-dark"
      value={value}
      beforeMount={beforeMount}
      onChange={handleChange}
      loading={
        <span className="text-sm text-muted">Cargando editor…</span>
      }
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontLigatures: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        tabSize: 4,
        renderLineHighlight: "all",
        automaticLayout: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
