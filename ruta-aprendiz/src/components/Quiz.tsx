import { useState } from 'react';
import type { QuizQuestion } from '../types';

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);

  const allAnswered = questions.every((_, i) => answers[i] != null);
  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="quiz">
      {questions.map((q, i) => (
        <div className="quiz-q" key={i}>
          <p className="quiz-prompt">{i + 1}. {q.q}</p>
          <ul className="quiz-opts">
            {q.options.map((opt, o) => {
              const chosen = answers[i] === o;
              const isAns = q.answer === o;
              const cls = revealed
                ? isAns
                  ? 'correct'
                  : chosen
                    ? 'wrong'
                    : ''
                : chosen
                  ? 'chosen'
                  : '';
              return (
                <li key={o}>
                  <button className={`quiz-opt ${cls}`} onClick={() => !revealed && setAnswers((a) => ({ ...a, [i]: o }))}>
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
          {revealed && <p className="quiz-explain">💡 {q.explain}</p>}
        </div>
      ))}
      <div className="quiz-actions">
        <button className="btn-ghost" onClick={() => setRevealed(true)} disabled={!allAnswered}>Revisar respuestas</button>
        {revealed && <span className="quiz-score">Aciertos: {score}/{questions.length}</span>}
      </div>
    </div>
  );
}
