// Copia el build del SPA "Ruta Aprendiz" al /public de Next.js.
//
// POR QUÉ EXISTE: `ruta-aprendiz/dist/` está en .gitignore, así que el bundle
// construido NO entra a git por sí solo. Lo que Vercel despliega es
// `web/public/ruta-aprendiz/`. Si el build no se copia ahí, el sitio sirve el
// bundle viejo indefinidamente y el deploy parece "no reflejar los cambios"
// aunque Vercel funcione perfecto (esto pasó el 2026-08-28: source con 14
// módulos commiteado, bundle desplegado con 5).
//
// Corre automáticamente como `postbuild` de `npm run build`.
// Node puro (fs.cpSync/rmSync) para que funcione igual en cmd.exe, PowerShell y bash.

import { existsSync, rmSync, cpSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "..", "dist");
const DEST = resolve(here, "..", "..", "web", "public", "ruta-aprendiz");

if (!existsSync(SRC)) {
  console.error(`[sync-public] ERROR: no existe ${SRC}. Corre "npm run build" primero.`);
  process.exit(1);
}

// Borra los assets viejos: sus nombres llevan hash, si no se limpian quedan
// huérfanos acumulándose en el repo y en el deploy.
const oldAssets = join(DEST, "assets");
if (existsSync(oldAssets)) {
  rmSync(oldAssets, { recursive: true, force: true });
}

cpSync(SRC, DEST, { recursive: true });

const copied = readdirSync(join(DEST, "assets"));
const html = readFileSync(join(DEST, "index.html"), "utf8");
const referenced = [...html.matchAll(/\/ruta-aprendiz\/assets\/([^"']+)/g)].map((m) => m[1]);

console.log(`[sync-public] ${SRC} -> ${DEST}`);
console.log(`[sync-public] assets copiados: ${copied.join(", ")}`);

// Verificación real: cada asset que index.html referencia debe existir en destino.
const missing = referenced.filter((r) => !copied.includes(r));
if (missing.length) {
  console.error(`[sync-public] ERROR: index.html referencia assets ausentes: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`[sync-public] OK: index.html referencia ${referenced.length} asset(s), todos presentes.`);
