# Ruta Aprendiz (QuantLab)

Subproyecto SPA que implementa la "Ruta Aprendiz" del brief de onboarding:
lleva a un novato de cero a competir en su primer torneo **sin escribir código**.

Stack: Vite + React + TypeScript. El mini-runner evalúa estrategias en el navegador
con series deterministas (PRNG con semilla); el seam a un backend real es un único
`runStrategy()` en `src/lib/runner.ts`.

## Secciones
- **Aprende** (nav): hub del curso gamificado (5 módulos) con XP, racha y badge.
- **Biblioteca** (nav): datasets filtrables por activo/nivel; el dataset del M2 queda fijado como favorito.
- **Módulo 5 = Torneo real**: la estrategia del M4 entra precargada (handoff sin clic).

## Comandos
- `npm install`
- `npm run dev`        (http://localhost:5173)
- `npm run build`      (typecheck + bundle)
- `npm run test:unit`  (vitest: runner + e2e de la Ruta Aprendiz)

## Estado
Fase 1 (sin sandbox en vivo / paper trading, fuera de alcance). Datos simulados.

## Integración con QuantLab (Next.js)
Por ahora vive como subproyecto independiente. Para montarlo dentro del Next.js:
embeber vía iframe en `/app/learn` o migrar los componentes a `web/src/app/learn/*`.
