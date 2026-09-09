# C5-L3 — Validación walk-forward (guion, ~4 min)

[VISUAL 0:00] Portada: "El k-fold miente" con folds mezclados al azar sobre una serie temporal.

El k-fold clásico en series financieras es una máquina de autoengaño: entrena con el futuro y evalúa con el pasado. Hoy lo reemplazamos por walk-forward. (0:15)

[VISUAL 0:15] Folds aleatorios saltando adelante y atrás en el tiempo, tachados en rojo.

El problema es el orden: si tu fold de validación es anterior a tu train, el modelo "aprende" regímenes que aún no ocurrieron. El Sharpe se infla al doble o triple… y en vivo se evapora. (0:40)

[VISUAL 0:40] Modelo espiando el futuro por encima de una pared, Sharpe inflándose como globo.

Walk-forward respeta el tiempo: entrenas en pasado, evalúas en el bloque siguiente, avanzas y repites. Expanding o rolling, pero siempre hacia adelante, con embargo entre train y test. (1:05)

[VISUAL 1:05] Ventana de train creciendo y bloque de test deslizándose hacia la derecha, tres veces.

En el notebook corremos tres folds sobre ciento catorce días: RMSE y hit-rate por fold, con cinco días de embargo en cada corte. Ningún fold ve el futuro, lo verificamos con asserts. (1:35)

[VISUAL 1:35] Los tres folds corriendo en el notebook, métricas apareciendo una por una.

Y el reporte honesto: promedio más dispersión out-of-sample, nunca el mejor pliegue. RMSE 0.027 ± 0.007, hit 0.54 ± 0.03. Modesto, real y defendible. (2:05)

[VISUAL 2:05] "0.54 ± 0.03" en grande, con el mejor fold tachado como "no reportable".

El contraste duele a propósito: el k-fold aleatorio sobre los mismos datos da R² negativo e inestable. El método tramposo ni siquiera es optimista de forma consistente — es ruidoso. (2:30)

[VISUAL 2:30] k-fold vs walk-forward cara a cara, el tramposo parpadeando inestable.

Tu misión: cambia el número de folds y el embargo y observa cómo se mueve la dispersión. Quien domina walk-forward deja de autoengañarse para siempre. Lección 4: Ridge contra LightGBM. (2:55)

[VISUAL 2:55] Cierre: "Valida hacia adelante, como opera el tiempo." + CTA al quiz.
