# C2-L3 — Piensa en vectores (guion, ~4 min)

[VISUAL 0:00] Portada: "Adiós al for" + bucle tachado con una X roja.

Si iteras fila por fila un millón de precios, tu backtest termina mañana. Si vectorizas, termina antes del café. Hoy cambiamos tu forma de pensar. (0:12)

[VISUAL 0:12] Cronómetro: bucle lento vs vector instantáneo.

Mira el ejemplo: cinco líneas de `for` para calcular retornos… contra una sola división de arrays. Mismo resultado, cincuenta veces más rápido. Y no me creas: en el notebook lo medimos con cronómetro real. (0:40)

[VISUAL 0:40] Código lado a lado: bucle vs `np.diff(c) / c[:-1]`, timer corriendo.

¿Por qué? Porque el bucle interno corre en C, compilado, sobre todo el array a la vez. Python solo da la orden; NumPy ejecuta el ejército. Es como empujar fichas de dominó una por una… o soplar y que caigan todas. (1:05)

[VISUAL 1:05] Animación de dominós cayendo de golpe.

Con pandas es aún más corto: `pct_change` te da el retorno simple, y una línea de log te da el logarítmico. ¿Recuerdas el curso 1? El simple es para contar, el log para sumar. Aquí los calculas los dos y ves que casi coinciden. (1:35)

[VISUAL 1:35] Dos curvas superpuestas: ret simple vs ret log, casi idénticas.

Y ahora tu primera señal de trading: precio contra media móvil de 20 días. Tres líneas —indicador, regla, señal— y tienes el esqueleto de todo backtest que harás en tu vida. ¿Rentable? Probablemente no. ¿Fundacional? Totalmente. (2:05)

[VISUAL 2:05] Precio cruzando la SMA20, señales +1/-1 marcadas con flechas.

El superpoder silencioso son las máscaras: una condición legible que filtra miles de filas sin un solo `if`. "Dame los días raros" en una línea. Cuando lo pruebas, no vuelves atrás. (2:30)

[VISUAL 2:30] Tabla filtrándose sola con `abs(ret) > 0.03`.

Aviso de veterano: ordena por fecha antes de usar `shift` o `pct_change`. Si el DataFrame viene desordenado, calculas basura con total confianza. `sort_values` primero, siempre. (2:55)

[VISUAL 2:55] Fechas desordenadas → resultados absurdos → sort → resultados correctos.

Tu misión: cambia la ventana de 20 a 10 y a 50 en el notebook y cuenta cuántas veces cambia la señal. Ese es tu primer análisis de sensibilidad, aunque no lo llames así. Nos vemos en la lección 4. (3:20)

[VISUAL 3:20] Cierre: "Piensa en columnas, no en filas." + CTA al quiz.
