# C6-L4 — Kelly y stake (guion, ~3 min)

[VISUAL 0:00] Portada: "Una estrategia ganadora también puede quebrar" + equity quebrada por sobre-apuesta.

Puedes tener filo y aun así arruinarte: basta apostar demasiado en cada ronda. Una mala racha te deja sin capital para la recuperación. (0:12)

[VISUAL 0:12] Misma estrategia, tres stakes: quiebra, crece, crece tranquila.

El criterio de Kelly da el óptimo: filo dividido por varianza. Más edge, más apuesta; más ruido, menos. Simple y brutal. (0:35)

[VISUAL 0:35] Fórmula `f* = filo / varianza` + perillas de filo y ruido moviendo la apuesta.

Pero tu filo estimado siempre es optimista —backtests, sesgos, suerte pasada—. Por eso los profesionales usan half-Kelly: la mitad. Casi igual de rentable, muchísimo menos susto. (1:00)

[VISUAL 1:00] Curvas de crecimiento Kelly vs half: casi iguales arriba, muy distintas en caídas.

Regla operativa con tope: stake recortado entre 0 y 0.25, y cero si no hay filo estimado. Sin edge no hay apuesta, por más que duela. (1:25)

[VISUAL 1:25] Código del tope `clip(0, 0.25)` + semáforo en rojo cuando el filo ≤ 0.

En el notebook simulas 60 rondas —fijo, Kelly, half— y luego el pecado mortal: doblar por encima del óptimo. Verás cómo pasarse destruye más que quedarse corto. Y tras perder, el stake se achica, jamás se dobla. (1:55)

[VISUAL 1:55] Simulación corriendo: tres capitales finales + la curva "Kelly x2" desplomándose.

Tu misión: corre la simulación y mira el orden final. El stake no es valentía, es aritmética. Nos vemos en la lección 5: el ensayo general. (2:25)

[VISUAL 2:25] Cierre: "El stake es aritmética, no valentía." + CTA al quiz.
