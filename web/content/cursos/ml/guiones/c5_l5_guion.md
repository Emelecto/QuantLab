# C5-L5 — MLP vs LSTM (guion, ~4 min)

[VISUAL 0:00] Portada: "Foto vs película" — una imagen fija contra una tira de cine.

Redes en mercados: a veces capturan secuencias que los árboles no ven, y muchas veces solo memorizan ruido con más estilo. Hoy las ponemos a prueba. (0:12)

[VISUAL 0:12] Red neuronal memorizando ruido con purpurina, etiqueta "estilo sin filo".

El MLP es foto: ve un vector de features del momento —lags, volatilidad— sin memoria. Rápido y decente cuando la señal vive en el corte transversal. (0:35)

[VISUAL 0:35] Vector de features entrando a capas densas, flash de cámara.

La LSTM es película: lee la secuencia ordenada de las últimas diez barras. Suena poderosa, y lo es — pero con ciento treinta muestras, sobreajusta en cuanto te descuidas. (1:00)

[VISUAL 1:00] Tira de diez velas entrando en orden a una celda de memoria.

En el notebook, sin torch a mano, el rival secuencial es un proxy honesto: la misma familia MLP pero sobre la ventana completa aplanada. Y ambos entrenan con early stopping — se detienen cuando validar deja de mejorar. (1:30)

[VISUAL 1:30] Curva de validación aplanándose y entrenamiento deteniéndose solo.

Resultado: el MLP foto logra 0.65 de hit, el secuencial 0.48 — peor que una moneda. La complejidad no se ganó su lugar en este dataset. Y esa es exactamente la lección. (2:00)

[VISUAL 2:00] Marcador "MLP 0.65 vs SEC 0.48", la complejidad haciendo flexiones inútiles.

En Colab con GPU puedes reemplazar el proxy por una LSTM real de torch y repetir el duelo. A veces ganará; muchas, no. La pregunta nunca es "¿qué modelo es mejor?" sino "¿en mis datos, con mis costos, paga la complejidad?". (2:30)

[VISUAL 2:30] Interruptor "complejidad" con medidor de costo-beneficio.

Tu misión: agranda la ventana, toca las capas y mira si el secuencial despierta. Cierras el curso C5 sabiendo validar, etiquetar y comparar sin autoengaños: eso te pone por encima del 90% de los backtests caseros. (2:55)

[VISUAL 2:55] Cierre: "La complejidad debe ganarse su lugar." + CTA al quiz y al proyecto.
