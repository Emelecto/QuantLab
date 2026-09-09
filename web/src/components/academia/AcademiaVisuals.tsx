"use client";

import { C1L1SimuladorEsperanza } from "./visuals/c1-l1";
import { C1L2PrecioRetornos } from "./visuals/c1-l2";
import { C1L3Histograma } from "./visuals/c1-l3";
import { C1L4EquityUnderwater } from "./visuals/c1-l4";
import C1L5 from "./visuals/c1-l5";
import C1L6 from "./visuals/c1-l6";
import C1L7 from "./visuals/c1-l7";
import C2L1 from "./visuals/c2-l1";
import C2L2 from "./visuals/c2-l2";
import C2L3 from "./visuals/c2-l3";
import C2L4 from "./visuals/c2-l4";
import C2L5 from "./visuals/c2-l5";
import C2L6 from "./visuals/c2-l6";
import C2L7 from "./visuals/c2-l7";
import C2L8 from "./visuals/c2-l8";
import C2L9 from "./visuals/c2-l9";
import C3L1Visual from "./visuals/c3-l1";
import C3L2Visual from "./visuals/c3-l2";
import C3L3Visual from "./visuals/c3-l3";
import C3L4Visual from "./visuals/c3-l4";
import C3L5Visual from "./visuals/c3-l5";
import C3L6Visual from "./visuals/c3-l6";
import C3L7Visual from "./visuals/c3-l7";
import C3L8Visual from "./visuals/c3-l8";
import C4L1Visual from "./visuals/c4-l1";
import C4L2Visual from "./visuals/c4-l2";
import C4L3Visual from "./visuals/c4-l3";
import C4L4Visual from "./visuals/c4-l4";
import C4L5Visual from "./visuals/c4-l5";
import C4L6Visual from "./visuals/c4-l6";
import C4L7Visual from "./visuals/c4-l7";
import C4L8Visual from "./visuals/c4-l8";
import C5L1Visual from "./visuals/c5-l1";
import C5L2Visual from "./visuals/c5-l2";
import C5L3Visual from "./visuals/c5-l3";
import C5L4Visual from "./visuals/c5-l4";
import C5L5Visual from "./visuals/c5-l5";
import C5L6Visual from "./visuals/c5-l6";
import C5L7Visual from "./visuals/c5-l7";
import C5L8Visual from "./visuals/c5-l8";
import C5L9Visual from "./visuals/c5-l9";
import C6L1Visual from "./visuals/c6-l1";
import C6L2Visual from "./visuals/c6-l2";
import C6L3Visual from "./visuals/c6-l3";
import C6L4Visual from "./visuals/c6-l4";
import C6L5Visual from "./visuals/c6-l5";
import C6L6Visual from "./visuals/c6-l6";
import C6L7Visual from "./visuals/c6-l7";
import C6L8Visual from "./visuals/c6-l8";
import C6L9Visual from "./visuals/c6-l9";
import C6ExamenVisual from "./visuals/c6-examen";

const MAP: Record<string, () => React.JSX.Element> = {
  "c1-l1": C1L1SimuladorEsperanza,
  "c1-l2": C1L2PrecioRetornos,
  "c1-l3": C1L3Histograma,
  "c1-l4": C1L4EquityUnderwater,
  "c1-l5": C1L5,
  "c1-l6": C1L6,
  "c1-l7": C1L7,
  "c2-l1": C2L1,
  "c2-l2": C2L2,
  "c2-l3": C2L3,
  "c2-l4": C2L4,
  "c2-l5": C2L5,
  "c2-l6": C2L6,
  "c2-l7": C2L7,
  "c2-l8": C2L8,
  "c2-l9": C2L9,
  "c3-l1": C3L1Visual,
  "c3-l2": C3L2Visual,
  "c3-l3": C3L3Visual,
  "c3-l4": C3L4Visual,
  "c3-l5": C3L5Visual,
  "c3-l6": C3L6Visual,
  "c3-l7": C3L7Visual,
  "c3-l8": C3L8Visual,
  "c4-l1": C4L1Visual,
  "c4-l2": C4L2Visual,
  "c4-l3": C4L3Visual,
  "c4-l4": C4L4Visual,
  "c4-l5": C4L5Visual,
  "c4-l6": C4L6Visual,
  "c4-l7": C4L7Visual,
  "c4-l8": C4L8Visual,
  "c5-l1": C5L1Visual,
  "c5-l2": C5L2Visual,
  "c5-l3": C5L3Visual,
  "c5-l4": C5L4Visual,
  "c5-l5": C5L5Visual,
  "c5-l6": C5L6Visual,
  "c5-l7": C5L7Visual,
  "c5-l8": C5L8Visual,
  "c5-l9": C5L9Visual,
  "c6-l1": C6L1Visual,
  "c6-l2": C6L2Visual,
  "c6-l3": C6L3Visual,
  "c6-l4": C6L4Visual,
  "c6-l5": C6L5Visual,
  "c6-l6": C6L6Visual,
  "c6-l7": C6L7Visual,
  "c6-l8": C6L8Visual,
  "c6-l9": C6L9Visual,
  "c6-examen": C6ExamenVisual,
};

export function AcademiaVisuals({ lessonId }: { lessonId: string }) {
  const Cmp = MAP[lessonId];
  if (!Cmp) return null;
  return <Cmp />;
}
