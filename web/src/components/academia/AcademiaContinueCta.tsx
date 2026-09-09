"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAcademiaProgress } from "./progress-store";
import type { AcademiaJourneyLesson } from "./AcademiaProgress";

// CTA «Continuar» del hub: resuelve en cliente la siguiente lección
// pendiente desde progress-store y enlaza a ella (patrón AcademiaProgress).
export function AcademiaContinueCta({ journey }: { journey: AcademiaJourneyLesson[] }) {
  const [next, setNext] = useState<AcademiaJourneyLesson | null>(null);

  useEffect(() => {
    const saved = loadAcademiaProgress();
    setNext(journey.find((l) => !saved.completed.includes(l.id)) ?? null);
  }, [journey]);

  if (!next) {
    return (
      <Link className="academia-btn academia-btn-secondary" href="/app/academia">
        Repasar los cursos
      </Link>
    );
  }

  return (
    <Link className="academia-btn academia-btn-primary" href={next.href}>
      Continuar en lección {next.n}: {next.titulo}
    </Link>
  );
}
