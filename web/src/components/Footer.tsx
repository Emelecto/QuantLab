import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Link href="/legal" className="transition-colors hover:text-ink">
            Legales
          </Link>
          <span aria-hidden className="text-line">
            ·
          </span>
          <Link href="/disclaimer" className="transition-colors hover:text-ink">
            Disclaimer
          </Link>
          <span aria-hidden className="text-line">
            ·
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink"
          >
            GitHub
          </a>
        </div>
        <p className="max-w-xl text-[12px] leading-relaxed text-muted">
          QuantLab es una herramienta de investigación. No es asesoría
          financiera ni recomendación de inversión.
        </p>
      </div>
    </footer>
  );
}
