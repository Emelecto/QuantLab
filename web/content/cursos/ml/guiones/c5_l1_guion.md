# C5-L1 — Features sin leakage (guion, ~3 min)

[VISUAL 0:00] Portada: "95% de precisión… y pierdes dinero" en rojo sobre equity cayendo.

Un modelo con 95% de precisión en backtest puede perder desde el día uno en vivo. No es mala suerte: es leakage, y hoy lo vas a cazar con tus propias manos. (0:12)

[VISUAL 0:12] Backtest verde espectacular que se desploma al pasar a "live".

El leakage es usar en tus features información del futuro que en vivo aún no existe. La regla de oro: la feature en t solo usa datos conocidos en t, con el cierre ya confirmado. (0:30)

[VISUAL 0:30] Vela en formación con candado vs vela cerrada con check: "solo usa velas cerradas".

En el notebook construimos cinco lags honestos del cierre: lag_1 es ayer, lag_5 es hace cinco días. Y lo verificamos celda por celda: el lag_1 de cada fila es exactamente el cierre del día anterior. (0:55)

[VISUAL 0:55] Código `df['lag_k'] = df['close'].shift(k)` + tabla mostrando el calce exacto.

Luego viene la prueba de fuego: entrenamos un Ridge honesto y otro con una feature filtrada del futuro. El honesto da R² negativo —el mercado es ruido—. El filtrado da 0.91. Esa brecha es la firma del leakage. (1:25)

[VISUAL 1:25] Dos barras: "honesto ≈ 0" vs "con fuga 0.91" con alarma.

Si desplazando la etiqueta el score no se cae, tu modelo está leyendo el futuro. Grábatelo: un score demasiado bueno en finanzas casi siempre es trampa, no talento. (1:50)

[VISUAL 1:50] Etiqueta desplazándose un paso y el score honesto derrumbándose.

Cerramos con embargo: quitamos del train las tres filas pegadas al test, porque los retornos vecinos comparten información. Poco dato sacrificado, mucha honestidad ganada. (2:15)

[VISUAL 2:15] Diagrama train–hueco de embargo–test, el hueco sombreado.

Tu misión: corre el notebook, mira el R² honesto contra el filtrado y Stef. Cuando veas esa brecha con tus propios ojos, nunca más confiarás en un backtest sin prueba de leakage. Nos vemos en la lección 2. (2:40)

[VISUAL 2:40] Cierre: "Si es demasiado bueno, es fuga." + CTA al quiz.
