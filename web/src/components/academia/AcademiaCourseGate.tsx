"use client";

import { useEffect, useState } from "react";
import { loadAcademiaProgress } from "./progress-store";

// Estado del gate de un curso según los QP locales: cada perfecta C1
// vale 1 QP y cada perfecta C2 vale 2 QP (ver registry lessonQP).
// Es orientativo (el QP real vive en Supabase); el índice no bloquea.
export function AcademiaCourseGate({ gateQp }: { gateQp: number }) {
  const [qp, setQp] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadAcademiaProgress();
    setQp(saved.perfect.reduce((acc, id) => acc + (id.startsWith("c2-") ? 2 : 1), 0));
  }, []);

  if (gateQp <= 0) {
    return <span className="academia-kicker">Acceso libre</span>;
  }
  if (qp == null) {
    return <span className="academia-locked-note">🔒 Requiere {gateQp} QP</span>;
  }
  if (qp >= gateQp) {
    return <span className="academia-kicker">Desbloqueado · {qp} QP</span>;
  }
  return (
    <span className="academia-locked-note">
      🔒 Te faltan {gateQp - qp} QP ({qp}/{gateQp})
    </span>
  );
}
