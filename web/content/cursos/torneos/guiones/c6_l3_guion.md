# C6-L3 — Estrategia neutral a beta (guion, ~3 min)

[VISUAL 0:00] Portada: "¿Alfa o beta disfrazada?" con equity que solo sube cuando el mercado sube.

Si tu estrategia brilla en semanas alcistas y se hunde en bajistas, malas noticias: no tienes selección, tienes dirección de mercado prestada. (0:12)

[VISUAL 0:12] Dos curvas superpuestas: tu equity calcando al mercado.

La beta se cuela sola: si tus features favorecen activos de beta alta, apuestas al mercado sin pedirlo. Primer paso: medirla, correlación de tu predicción con beta. (0:35)

[VISUAL 0:35] Código `df['pred'].corr(df['beta'])` con el valor lejos de cero en rojo.

La neutralización tiene dos pasos por era: restas la media de la semana —nadie cobra por predecir que todo sube— y quitas con regresión lo que beta explica. Te quedas con el residuo: tu selección pura. (1:05)

[VISUAL 1:05] Diagrama en dos pasos: demean → regresión → residuo etiquetado "selección pura".

Y se verifica, no se declara: correlación con beta en ≈ 0 y CORR por era aún positivo. Si ambas caen a cero, tu señal era solo mercado. (1:35)

[VISUAL 1:35] Doble check: "corr con beta ≈ 0 ✓" y "CORR > 0 ✓".

Ojo con la trampa: neutralizar con datos de toda la muestra filtra futuro. Cada era se neutraliza con lo suyo, como en la lección 1. Tu misión: salta la regresión y deja solo el demean, mira cuánta beta sobrevive. (2:05)

[VISUAL 2:05] Experimento del notebook: demean solo vs completo, barras comparadas.

Cierre: quitarle el viento al navegante revela si sabe navegar. Nos vemos en la lección 4, donde decidimos cuánto apostar. (2:30)

[VISUAL 2:30] Cierre: "Sin viento se ve al navegante." + CTA al quiz.
