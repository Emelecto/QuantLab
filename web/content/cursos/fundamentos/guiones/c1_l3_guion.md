# C1-L3 — Volatilidad y colas (guion, ~4 min)

[VISUAL 0:00] Portada: campana de Gauss con una barra naranja suelta a la derecha: "Lo normal no es normal".

Te voy a decir algo que me costó dinero entender: en cripto, los días imposibles pasan. Y pasan más seguido de lo que tu intuición cree. (0:12)

[VISUAL 0:12] Yo marcando con el dedo un día de +9.6% en una serie de BTC.

Mira este dataset: 60 días de retornos de BTC. La media es casi cero, 0.07%, y la dispersión típica —la famosa sigma— es 2.88%. O sea, un día normal se mueve entre menos 3 y más 3 por ciento. (0:35)

[VISUAL 0:35] Histograma creciendo barra a barra, con la línea +3σ punteada.

Pero hay un día de +9.6%. Divides 9.6 entre 2.88 y te da 3.3 sigmas. En los libros eso casi nunca pasa; en cripto es un martes con noticias. A eso se le llama cola pesada: los extremos pesan más de lo que la teoría dice. (1:00)

[VISUAL 1:00] Zoom a la barra naranja del día extremo, etiqueta "+3.3σ".

Y ojo con la trampa mental: volatilidad no es dirección. Un activo puede terminar el mes plano y aun así ser una montaña rusa. La volatilidad responde qué tan grandes son los sustos, nunca hacia dónde van. (1:25)

[VISUAL 1:25] Línea de precio terminando plana pero con subidas y caídas violentas en medio.

Yo antes veía una caída de 3 sigmas y pensaba "ya no puede caer más, compro el doble". Error carísimo. Las colas se agrupan: después de un día extremo suele venir más volatilidad, no calma. Tu tamaño de posición tiene que asumir que mañana se puede repetir. (1:55)

[VISUAL 1:55] Dos velas rojas gigantes seguidas, con mi cara de arrepentimiento al lado.

En el notebook vas a calcular la sigma tú mismo con pandas, convertir cada día a sigmas y cazar el día de cola con tus propias manos. Cuando lo encuentres, fíjate en algo: el resto de la distribución se ve normal a su lado. Las colas se esconden entre días aburridos. (2:25)

[VISUAL 2:25] Notebook corriendo: histograma con la línea +3σ y el día extremo resaltado.

Regla para llevarte: mide todo en sigmas y planea como si el día de 3 sigmas fuera a llegar esta semana. Porque algún día llega. (2:50)

[VISUAL 2:50] Cierre: "±3σ no es un milagro, es el paisaje." + CTA al quiz.

Nos vemos en la lección 4, donde medimos si el viaje valió la pena con Sharpe, Sortino y drawdown. (3:05)

[VISUAL 3:05] Avance L4: curva de equity con zona underwater sombreada.
