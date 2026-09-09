# C6-L1 — Reglas, eras y submission (guion, ~3 min)

[VISUAL 0:00] Portada: "No compites contra el mercado: compites con las mismas reglas" + tabla de posiciones.

En un torneo cuantitativo no gana el mejor modelo en abstracto: gana el mejor modelo dentro de unas reglas. Y la primera regla son las eras. (0:12)

[VISUAL 0:12] Línea de tiempo partida en bloques semanales sellados: "era 1 … era 12".

Cada era es una semana de mercado. Entrenas con las pasadas, validas con las futuras, y jamás las mezclas. Mezclar eras es el mismo leakage del curso 5 con otro disfraz. (0:35)

[VISUAL 0:35] Shuffle aleatorio tachado en rojo vs corte por era en verde.

Segunda regla: la submission. Un archivo con id y prediction, un valor entre 0 y 1 por activo, sin nulos ni duplicados. Mal formado no se puntúa: ni se corrige. (1:00)

[VISUAL 1:00] Código `sub['prediction'].between(0, 1).all()` + check verde fila por fila.

En el notebook la construimos desde una feature y la validamos con tres asserts: rango, unicidad y nulos. Tres líneas que te salvan la ronda. (1:25)

[VISUAL 1:25] Tres asserts ejecutándose en el notebook, todo en verde.

Tercera regla: una ronda, un envío oficial. Por eso el flujo es experimentar en local, validar el formato y recién entonces enviar. (1:50)

[VISUAL 1:50] Embudo "local → validar → enviar" con un solo ticket de envío al final.

Tu misión: corre el notebook, rompe el formato a propósito y mira qué chequeo salta. Cuando veas lo fácil que es fallar en local y lo caro que es fallar en el envío, no volverás a enviar sin validar. Nos vemos en la lección 2. (2:20)

[VISUAL 2:20] Cierre: "Valida en local, envía una vez." + CTA al quiz.
