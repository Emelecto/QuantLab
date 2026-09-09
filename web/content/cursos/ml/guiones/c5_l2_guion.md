# C5-L2 — Etiquetado y embargo (guion, ~3 min)

[VISUAL 0:00] Portada: "La etiqueta es la mitad del modelo" con dos equity opuestas del mismo modelo.

El mismo modelo, las mismas features… y pasa de rentable a ruina según cómo etiquetes cada vela. Hoy: etiquetado con horizonte fijo y triple barrera, más embargo. (0:12)

[VISUAL 0:12] Mismas features entrando a dos etiquetas distintas, dos resultados opuestos.

La etiqueta más simple: ¿sube o baja en los próximos tres días, después de costos? Sin restar comisiones, el ruido te paga; con costos, solo sobreviven las señales con margen real. (0:35)

[VISUAL 0:35] Fórmula `y = (ret_futuro - costo > 0)` + monedas cayendo como "costos".

Pero el futuro rara vez espera al vencimiento: por eso la triple barrera. Marcas take-profit, stop-loss y tiempo máximo; lo que se toque primero manda la etiqueta. Es etiquetar como se opera. (1:00)

[VISUAL 1:00] Vela avanzando hasta chocar con una de tres barreras dibujadas.

En el notebook lo calculamos paso a paso sobre sesenta días: retorno futuro a tres días, etiqueta fija, etiqueta triple barrera. Treinta positivos contra treinta y uno — el matiz importa. (1:25)

[VISUAL 1:25] Tabla del notebook con las columnas y_fijo vs y_tb divergiendo en filas.

Y el embargo: las muestras cercanas en el tiempo comparten el mismo evento, así que purgamos tres filas del train pegadas al test. Sin embargo el accuracy se infla; con embargo, cae a lo honesto. (1:50)

[VISUAL 1:50] Muestras vecinas conectadas por hilos que unas tijeras ("embargo") cortan.

Ojo con lo que vimos: 50% contra 50% en este dataset. El embargo no te regala precisión — te quita la mentira. Un modelo honesto mediocre vale más que un modelo tramposo brillante. (2:15)

[VISUAL 2:15] Barra inflada pinchándose hasta su tamaño real, etiqueta "honesto".

Tu misión: cambia el horizonte y los costos en el notebook y mira cómo cambia el balance de etiquetas. Quien controla la etiqueta, controla el modelo. Lección 3: walk-forward. (2:40)

[VISUAL 2:40] Cierre: "Etiqueta como operas." + CTA al quiz.
