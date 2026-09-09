import Link from "next/link";
import { getCourses, getCourseLessons, totalQP, PERFECT_BONUS_QP } from "@/lib/academia/registry";
import {
  AcademiaProgress,
  type AcademiaJourneyLesson,
} from "@/components/academia/AcademiaProgress";
import { AcademiaContinueCta } from "@/components/academia/AcademiaContinueCta";
import { AcademiaCourseGate } from "@/components/academia/AcademiaCourseGate";
import "./academia.css";

// Hub de Academia: hero compacto + progreso global + cards de curso (genérico por COURSES)
// + CTA continuar (siguiente lección pendiente entre los seis cursos).
export default function AcademiaPage() {
  const courses = getCourses();
  const lessonsByCourse = courses.map((c) => ({
    course: c,
    lessons: getCourseLessons(c.slug),
    qp: totalQP(c.slug),
  }));
  const totalLessons = lessonsByCourse.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalExams = lessonsByCourse.reduce(
    (acc, c) => acc + c.lessons.filter((l) => l.tipo === "exam").length,
    0,
  );
  const lessonCount = totalLessons - totalExams;
  const qp = totalQP();

  const journey: AcademiaJourneyLesson[] = lessonsByCourse.flatMap(({ course, lessons }) =>
    lessons.map((l) => ({
      id: l.id,
      n: l.leccion,
      titulo: `${course.titulo}: ${l.titulo}`,
      minutos: l.duracion_video_min,
      qp: l.qp,
      href: `/app/academia/${course.slug}/${l.leccion}`,
    })),
  );

  return (
    <div className="academia-scope">
      <div>
        <header className="academia-hero">
          <span className="academia-kicker">Academia QuantLab</span>
          <h1>Aprende midiendo</h1>
          <p>
            {courses.length} cursos · {lessonCount} lecciones{totalExams > 0 ? ` + ${totalExams} examen` : ""} · +{qp} QP + {PERFECT_BONUS_QP} bonus
            todo-perfecto por curso. Cada lección con quiz perfecto suma QP; el examen final aprueba con 14/20.
          </p>
          <AcademiaProgress totalLessons={totalLessons} />
        </header>

        <div className="academia-cta-row">
          <AcademiaContinueCta journey={journey} />
        </div>

        <section>
          <h2 className="academia-section-title">Cursos</h2>
          <div className="academia-lesson-list">
            {lessonsByCourse.map(({ course, lessons, qp: courseQp }, i) => (
              <Link
                key={course.slug}
                href={`/app/academia/${course.slug}`}
                className="academia-lesson-row"
              >
                <div className="academia-lesson-num">C{i + 1}</div>
                <div className="academia-lesson-body">
                  <span className="academia-kicker">
                    {course.nivel} · {lessons.filter((l) => l.tipo !== "exam").length} lecciones
                    {lessons.some((l) => l.tipo === "exam") ? " + examen" : ""}
                  </span>
                  <h3>{course.titulo}</h3>
                  <span className="academia-lesson-meta academia-lesson-xp">
                    +{courseQp} QP + {PERFECT_BONUS_QP} bonus todo-perfecto
                  </span>
                  <AcademiaCourseGate gateQp={course.gate_qp} />
                </div>
                <span className="academia-lesson-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
