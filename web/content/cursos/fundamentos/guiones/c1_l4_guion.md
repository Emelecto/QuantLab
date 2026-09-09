# C1-L4 — Sharpe, Sortino y drawdown (guion, ~4 min)

[VISUAL 0:00] Portada: dos curvas llegando a la misma meta, una suave y una con un cráter en medio.

Te pongo un dilema real: dos estrategias terminan el año con el mismo retorno. Una subió tranquila; la otra se hundió 26% en medio y luego se recuperó. ¿Cuál prefieres? Si dudas, esta lección es para ti. (0:15)

[VISUAL 0:15] Animación de las dos curvas avanzando, la segunda cayendo a un pozo marcado "−26%".

El Sharpe es la primera respuesta. Divides el retorno medio entre su volatilidad y obtienes el retorno por unidad de susto. Nuestra serie demo de SOL da Sharpe 1.05: aceptable, nada para presumir en una cena. Por encima de 2 ya hablamos de algo serio; por debajo de 0.5, ruido con marketing. (0:45)

[VISUAL 0:45] Pizarra: Sharpe = media / desviación × √252, con el semáforo <0.5 / 1 / 2.

Pero el Sharpe tiene un defecto: castiga también las subidas. Si un día ganas 15%, el Sharpe se queja de la volatilidad. ¿En serio? Por eso existe el Sortino, que solo divide entre la volatilidad de los días malos. En la demo el Sortino da 1.53, bastante más alto: hubo fiestas que el Sharpe estaba castigando sin motivo. (1:15)

[VISUAL 1:15] Barras verdes y rojas: las verdes dejan de pesar en el Sortino.

Y ahora mi métrica favorita para no autoengañarme: el drawdown. Es la caída desde tu último pico. La demo tocó 141.72 y se hundió hasta un −26.14%. Ese número es el MaxDD: el peor susto del período. (1:45)

[VISUAL 1:45] Equity curve con el pico marcado y la flecha del drawdown hasta el fondo.

Lo que nadie te cuenta es el underwater: el tiempo que pasas por debajo del agua esperando recuperar. El mismo −26% que se recupera en una semana es un susto; si tarda ocho meses, es una prueba de fe que casi nadie aguanta sin romper las reglas. (2:10)

[VISUAL 2:10] Zona sombreada bajo el pico alargándose en el tiempo, calendario pasando páginas.

Yo una vez elegí una estrategia por su retorno anual sin mirar el MaxDD. Cuando llegó el cráter, descubrí que mi estómago no estaba incluido en el backtest. Abandoné en el fondo, como casi todo el mundo. (2:35)

[VISUAL 2:35] Mi equity real de aquella época: abandono justo antes de la recuperación.

En el notebook vas a calcular las tres métricas sobre el equity de SOL y a dibujar la curva con su zona underwater. Hazlo y pregúntate con honestidad: ¿habrías aguantado ese cráter con dinero de verdad? (3:00)

[VISUAL 3:00] Notebook: equity + underwater, con los tres números impresos.

Regla para llevarte: nunca elijas por retorno sin mirar el MaxDD. Primero pregunta cuánto tendrías que aguantar; después, cuánto puedes ganar. (3:20)

[VISUAL 3:20] Cierre: "Mide el camino, no solo la meta." + CTA al quiz.

En la lección 5 vemos con quién se mueve tu moneda: correlación y beta. (3:35)

[VISUAL 3:35] Avance L5: matriz de correlación BTC/ETH/SOL iluminándose.
