export function Stub({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div className="stub">
      <div className="stub-icon">{icon}</div>
      <h1>{title}</h1>
      <p>{body}</p>
      <p className="stub-note">Ruta Aprendiz es nuevo. Este módulo queda intacto para usuarios pro.</p>
    </div>
  );
}
