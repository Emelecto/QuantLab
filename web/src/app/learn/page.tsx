import type { Metadata } from "next";
import { CourseProgressBridge } from "./CourseProgressBridge";

export const metadata: Metadata = {
  title: "Aprende — QuantLab",
  description:
    "Ruta Aprendiz: de cero a tu primer torneo de trading cuantitativo, sin escribir código.",
};

// Página pública que monta la Ruta Aprendiz (SPA construida en /public/ruta-aprendiz).
// Se sirve en un iframe a pantalla completa; el SPA detecta ?embed=1 y oculta su
// propia nav para que la barra de QuantLab dirija la navegación (sin barras duplicadas).
// CourseProgressBridge sincroniza el progreso del curso con Supabase cuando hay sesión.
export default function LearnPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col">
      <iframe
        src="/ruta-aprendiz/index.html?embed=1"
        title="Ruta Aprendiz — QuantLab"
        className="h-[calc(100vh-3.5rem)] w-full border-0"
        style={{ display: "block" }}
      />
      <CourseProgressBridge />
    </div>
  );
}
