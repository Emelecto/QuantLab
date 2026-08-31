import { Lesson } from "@/components/learn/Lesson";

export default async function LearnModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moduleId = Number(id);
  return (
    <div className="ql-learn-wrap">
      <Lesson moduleId={moduleId} />
    </div>
  );
}
