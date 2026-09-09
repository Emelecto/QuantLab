"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { earnQP } from "@/lib/tokens";
import type { AcademiaQuizQuestion } from "@/lib/academia/registry";
import { loadAcademiaProgress, markLessonComplete } from "./progress-store";

// Panel del quiz de la lección. Renderiza N preguntas (N varía por
// lección) y otorga lesson.qp QP con N/N en lecciones (1 en C1, 2 en C2–C6)
// o con ≥70% en el examen final (prop `umbral`, 7 QP con 14/20 en C6).
// Reutiliza el CourseProgressBridge existente (montado en la página) para
// la sesión/Supabase y acredita vía earnQP; además persiste el progreso
// local y sincroniza completed_lessons (best-effort: si la migración aún
// no está aplicada, no tumba la UI).

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function AcademiaQuizPanel({
  lessonId,
  questions,
  qp = 1,
  umbral = 1,
}: {
  lessonId: string;
  questions: AcademiaQuizQuestion[];
  qp?: number;
  /** Fracción de aciertos para aprobar (1 = N/N; 0.7 = examen final). */
  umbral?: number;
}) {
  const total = questions.length;
  const required = Math.min(total, Math.ceil(total * umbral));
  const isExam = umbral < 1;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const awardTried = useRef(false);

  useEffect(() => {
    setAnswers({});
    setRevealed(false);
    setAwarded(false);
    awardTried.current = false;
    const saved = loadAcademiaProgress();
    if (saved.perfect.includes(lessonId)) setAwarded(true);
  }, [lessonId]);

  const answeredCount = questions.filter((_, i) => answers[i] != null).length;
  const allAnswered = answeredCount === total;
  const score = questions.filter((q, i) => answers[i] === q.answer).length;
  const passed = revealed && score >= required;
  const isPerfect = revealed && score === total;

  const awardQP = useCallback(async () => {
    if (awardTried.current) return;
    awardTried.current = true;
    setAwarding(true);
    markLessonComplete(lessonId, true);
    setAwarded(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await earnQP(qp, isExam ? "examen_aprobado" : "quiz_perfect", lessonId, isExam ? `Examen ${lessonId} aprobado (${score}/${total})` : `Quiz ${lessonId} perfecto (${total}/${total})`);
        try {
          const { data } = await supabase
            .from("course_progress")
            .select("completed_lessons")
            .eq("user_id", user.id)
            .maybeSingle();
          const prev = (data?.completed_lessons as string[] | null) ?? [];
          if (!prev.includes(lessonId)) {
            await supabase.from("course_progress").upsert(
              { user_id: user.id, completed_lessons: [...prev, lessonId] },
              { onConflict: "user_id" },
            );
          }
        } catch {
          /* columna aún no aplicada: el progreso local ya guardó el avance */
        }
      }
    } catch {
      /* visitante o sin red: el progreso local ya guardó el avance */
    } finally {
      setAwarding(false);
    }
  }, [lessonId, total, qp, required, isExam, score]);

  useEffect(() => {
    if (passed && !awarded) void awardQP();
  }, [passed, awarded, awardQP]);

  function retry() {
    setAnswers({});
    setRevealed(false);
  }

  return (
    <div className="academia-quiz">
      <style>{`
        .academia-quiz { color: #f7f8f8; }
        .academia-quiz-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
        .academia-quiz-kicker { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8a8f98; margin-bottom: 4px; }
        .academia-quiz-title { margin: 0; font-size: 18px; font-weight: 700; }
        .academia-quiz-counter { flex: 0 0 auto; font-size: 13px; color: #8a8f98; font-variant-numeric: tabular-nums; padding-top: 20px; }
        .academia-quiz-dots { display: flex; gap: 6px; margin: 12px 0 16px; }
        .academia-quiz-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.12); }
        .academia-quiz-dot[data-on="true"] { background: #f7f8f8; }
        .academia-quiz-q { background: #0c0d0f; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin: 0 0 12px; }
        .academia-quiz-prompt { margin: 0 0 4px; font-size: 12px; color: #8a8f98; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .academia-quiz-question { margin: 0 0 12px; font-size: 15px; font-weight: 600; line-height: 1.5; }
        .academia-quiz-opts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .academia-quiz-opt { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: transparent; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; color: #f7f8f8; font-size: 14px; line-height: 1.45; cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease; }
        button.academia-quiz-opt:hover:not(:disabled) { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.03); }
        button.academia-quiz-opt:focus-visible { outline: 2px solid #5e6ad2; outline-offset: 2px; }
        button.academia-quiz-opt:disabled { cursor: default; }
        .academia-quiz-letter { flex: 0 0 auto; width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); color: #8a8f98; }
        .academia-quiz-opt[data-state="elegida"] { border-color: #f7f8f8; background: rgba(255,255,255,0.05); }
        .academia-quiz-opt[data-state="elegida"] .academia-quiz-letter { background: #f7f8f8; color: #08090a; }
        .academia-quiz-opt[data-state="correcta"] { border-color: rgba(70,192,138,0.6); background: rgba(70,192,138,0.1); }
        .academia-quiz-opt[data-state="correcta"] .academia-quiz-letter { background: #46c08a; color: #08090a; }
        .academia-quiz-opt[data-state="incorrecta"] { border-color: rgba(229,72,77,0.6); background: rgba(229,72,77,0.08); }
        .academia-quiz-opt[data-state="incorrecta"] .academia-quiz-letter { background: #e5484d; color: #fff; }
        .academia-quiz-opt[data-state="atenuada"] { opacity: 0.5; }
        .academia-quiz-explain { margin: 12px 0 0; padding: 10px 12px; font-size: 13px; line-height: 1.55; color: #8a8f98; border-left: 2px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.02); border-radius: 0 8px 8px 0; }
        .academia-quiz-explain strong { color: #f7f8f8; font-weight: 600; }
        .academia-quiz-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
        .academia-quiz-cta { background: #5e6ad2; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: filter 0.15s ease; }
        .academia-quiz-cta:hover:not(:disabled) { filter: brightness(1.1); }
        .academia-quiz-cta:disabled { opacity: 0.4; cursor: not-allowed; }
        .academia-quiz-cta:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .academia-quiz-secondary { background: transparent; color: #f7f8f8; border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .academia-quiz-secondary:hover { border-color: rgba(255,255,255,0.32); }
        .academia-quiz-score { font-size: 13px; color: #8a8f98; font-variant-numeric: tabular-nums; }
        .academia-quiz-perfect { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: rgba(70,192,138,0.1); border: 1px solid rgba(70,192,138,0.4); font-size: 14px; font-weight: 600; color: #f7f8f8; }
        .academia-quiz-qpbadge { flex: 0 0 auto; background: #46c08a; color: #08090a; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
        .academia-quiz-retry-note { margin: 12px 0 0; font-size: 13px; color: #8a8f98; }
      `}</style>

      <div className="academia-quiz-head">
        <div>
          <span className="academia-quiz-kicker">
            Quiz · {total} preguntas · necesitas {required}/{total} para {qp} QP
          </span>
          <h2 className="academia-quiz-title">Comprueba lo aprendido</h2>
        </div>
        <span className="academia-quiz-counter">
          {answeredCount}/{total} respondidas
        </span>
      </div>
      <div className="academia-quiz-dots" aria-hidden="true">
        {questions.map((_, i) => (
          <span key={i} className="academia-quiz-dot" data-on={answers[i] != null} />
        ))}
      </div>

      {questions.map((q, i) => (
        <div className="academia-quiz-q" key={i}>
          <p className="academia-quiz-prompt">Pregunta {i + 1} de {total}</p>
          <p className="academia-quiz-question">{q.q}</p>
          <ul className="academia-quiz-opts">
            {q.options.map((opt, o) => {
              const chosen = answers[i] === o;
              const isAns = q.answer === o;
              const state = revealed
                ? isAns
                  ? "correcta"
                  : chosen
                    ? "incorrecta"
                    : "atenuada"
                : chosen
                  ? "elegida"
                  : "pendiente";
              return (
                <li key={o}>
                  <button
                    type="button"
                    className="academia-quiz-opt"
                    data-state={state}
                    aria-pressed={chosen}
                    disabled={revealed}
                    onClick={() => !revealed && setAnswers((a) => ({ ...a, [i]: o }))}
                  >
                    <span className="academia-quiz-letter" aria-hidden="true">
                      {LETTERS[o] ?? o + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {revealed && (
            <p className="academia-quiz-explain">
              <strong>Explicación: </strong>
              {q.explain}
            </p>
          )}
        </div>
      ))}

      <div className="academia-quiz-actions">
        {!revealed && (
          <button
            type="button"
            className="academia-quiz-cta"
            onClick={() => setRevealed(true)}
            disabled={!allAnswered}
          >
            Revisar respuestas
          </button>
        )}
        {revealed && !passed && (
          <button type="button" className="academia-quiz-secondary" onClick={retry}>
            Reintentar
          </button>
        )}
        {revealed && (
          <span className="academia-quiz-score">
            Aciertos: {score}/{total}
          </span>
        )}
      </div>

      {passed && (
        <div className="academia-quiz-perfect" role="status">
          <span className="academia-quiz-qpbadge">+{qp} QP</span>
          <span>
            {awarding
              ? `Acreditando ${qp} QP…`
              : awarded
                ? isPerfect
                  ? `Quiz perfecto. Sumaste ${qp} QP a tu progreso.`
                  : `Examen aprobado (${score}/${total}). Sumaste ${qp} QP a tu progreso.`
                : null}
          </span>
        </div>
      )}
      {revealed && !passed && (
        <p className="academia-quiz-retry-note">
          Te faltaron {required - score}. Reintenta: el QP se otorga con {required}/{total} o más.
        </p>
      )}
    </div>
  );
}
