import type { Metadata } from "next";
import { LibraryBridge } from "./LibraryBridge";

export const metadata: Metadata = {
  title: "Biblioteca de Datasets — QuantLab",
  description:
    "Explora los datasets de la comunidad: cripto, acciones, índices y macro. Filtra por activo y nivel.",
};

// Biblioteca accesible desde cualquier parte del sitio (no solo desde Aprende).
// Reutiliza el SPA de ruta-aprendiz en modo librería (?view=library) para no
// duplicar la lógica de filtros y favoritos. El botón "Volver a Aprende" del
// SPA avisa al padre vía postMessage y este puente navega a /learn.
export default function LibraryPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col">
      <iframe
        src="/ruta-aprendiz/index.html?embed=1&view=library"
        title="Biblioteca de Datasets — QuantLab"
        className="h-[calc(100vh-3.5rem)] w-full border-0"
        style={{ display: "block" }}
      />
      <LibraryBridge />
    </div>
  );
}
