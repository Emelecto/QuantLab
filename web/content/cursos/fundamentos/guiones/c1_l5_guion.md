# C1-L5 — Correlación y beta (guion, ~4 min)

[VISUAL 0:00] Portada: tres monedas con disfraces distintos moviéndose al mismo ritmo: "Una apuesta disfrazada de tres".

Te hago una pregunta incómoda: tienes BTC, ETH y SOL. ¿Tienes tres apuestas o una sola con tres nombres? La respuesta está en un número entre menos uno y uno. (0:12)

[VISUAL 0:12] Yo sosteniendo tres monedas que suben y bajan sincronizadas con cuerdas.

Ese número es la correlación. Cerca de uno: se mueven juntos. Cerca de cero: cada uno va a lo suyo. Cerca de menos uno: cuando uno sube el otro baja, que es lo ideal para diversificar y lo más difícil de encontrar. (0:35)

[VISUAL 0:35] Tres pares de líneas animadas: juntas, independientes y opuestas.

Mira la matriz real de nuestro demo de 60 días: BTC y ETH correlacionan 0.91. Son casi gemelos. Si tienes los dos creyendo que diversificas, te tengo noticias: apenas lo haces. SOL está en 0.74 con BTC y 0.70 con ETH: acompaña a la manada, pero con más vida propia. (1:05)

[VISUAL 1:05] Matriz iluminándose celda por celda, el bloque BTC–ETH brillando más.

Y una aclaración que me habría ahorrado discusiones: correlación no es causalidad. Que BTC y ETH se muevan juntos no significa que BTC cause nada. Solo comparten el mismo clima: cuando llueve en cripto, todos se mojan. (1:30)

[VISUAL 1:30] Nube lloviendo sobre tres gráficos a la vez.

La segunda herramienta es la beta: cuánto se mueve tu moneda cuando BTC se mueve 1%. En el demo, ETH tiene beta 0.87 y SOL 0.66. Si BTC se mueve 2% en un día, ETH tiende a moverse 1.7% y SOL 1.3%, en la misma dirección. Beta menor que uno no significa seguro: significa que se mueve menos que el jefe, para arriba y para abajo. (2:00)

[VISUAL 2:00] BTC dando un paso grande, ETH un paso mediano y SOL uno más corto, todos al mismo lado.

Yo antes coleccionaba monedas del mismo sector creyendo que diversificaba. Cuando llegó la caída, todas cayeron juntas y descubrí la verdad: no tenía un portafolio, tenía una apuesta con cinco logos. Diversificar de verdad es mezclar cosas que no se mueven juntas. (2:30)

[VISUAL 2:30] Cinco logos cayendo en picada a la vez, fundiéndose en una sola línea.

En el notebook vas a calcular la matriz con pandas, dibujar el mapa de calor y estimar las betas con una regresión sencilla. Y el scatter de SOL contra BTC te va a mostrar la beta con tus propios ojos: la pendiente de esa nube de puntos. (2:55)

[VISUAL 2:55] Notebook: heatmap + scatter con la recta de pendiente 0.66.

Regla para llevarte: antes de añadir una moneda a tu portafolio, mira su correlación con lo que ya tienes. Si es 0.9, no estás diversificando: estás repitiendo. (3:20)

[VISUAL 3:20] Cierre: "Diversificar es descorrelacionar." + CTA al quiz.

Con esto cierras el bloque de medición: volatilidad, riesgo ajustado y compañía. Lo que sigue es ponerlo a trabajar. (3:35)

[VISUAL 3:35] Resumen visual del bloque L3–L5: sigma, MaxDD y matriz en tres tarjetas.
