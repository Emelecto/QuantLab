# C2-L6 — Backtest SMA con costos: el neto manda (guion, ~4 min)

[VISUAL 0:00] Portada: dos curvas casi gemelas, una etiquetada "bruto" y otra "neto", con unas tijeras mordiendo la diferencia: "El bruto es marketing".

Te voy a contar el backtest más honesto que programé en mucho tiempo, y empieza con una decepción. Cruce de medias móviles, diez contra treinta, ciento veinte días de BTC. En bruto gana 11,53%. Yo ya estaba sonriendo. Le resté costos y quedó en 11,25%. Y después miré el buy-and-hold: más 27,87% sin mover un dedo. (0:20)

[VISUAL 0:20] Tres barras creciendo: neto, bruto y el sofá que las duplica a todas.

La lección de hoy tiene tres números y una regla de oro. Los números: bruto más 11,53, neto más 11,25, sofá más 27,87. La regla: la posición de hoy se calcula con datos hasta ayer, sin excepciones. Ese es el shift de uno en el código, y es lo que separa un backtest de una fantasía. (0:45)

[VISUAL 0:45] Línea de código con el shift(1) iluminado como un cinturón de seguridad.

Mira la señal, que es tonta a propósito: si la media de diez días está por encima de la de treinta, estás dentro; si no, fuera. Pero la media que opera hoy usa cierres hasta ayer. ¿Por qué? Porque en vivo, cuando decides, el cierre de hoy todavía no existe. Operar el cierre de hoy con la señal de hoy es mirar el futuro, se llama lookahead, y convierte cualquier porquería en máquina de dinero… en el pasado. (1:10)

[VISUAL 1:10] Calendario donde la mano intenta agarrar el precio de hoy y se le escurre; etiqueta "lookahead".

Vamos a los costos, que es donde esta lección muerde. Cada cambio de posición paga cinco puntos básicos: comisión, spread y deslizamiento en un solo número honesto. El cruce operó cinco veces en ciento veinte días: cinco por cinco, veinticinco puntos básicos de costo total. El arrastre final es 0,28 puntos. Con cinco trades duele poco. Con quinientos, el mismo cinco bps te deja en los huesos. Grábate esto: los costos no castigan el tamaño, castigan la rotación. (1:40)

[VISUAL 1:40] Cinco fichas de trade cayendo en una alcancía rota; contador "25 bps".

Y ahora la parte que duele de verdad. BTC subió de sesenta mil a setenta y seis mil setecientos en el período. Tu cruce, con código, señal y costos bien calculados, sacó más once con Sharpe de 0,94 y un susto de menos diez en el camino. Batir al cero no basta: hay que batir al sofá. Esa es la vara real de toda estrategia, y la mayoría no la pasa. (2:05)

[VISUAL 2:05] Curva del cruce subiendo modestamente mientras el buy-and-hold se escapa por arriba.

En el notebook vas a cargar los ciento veinte cierres, programar la señal con su shift, restar los cinco bps y pintar el equity bruto contra el neto. Verifica con tus ojos que el neto nunca supera al bruto: si lo supera, no descubriste nada, tienes un bug. (2:30)

[VISUAL 2:30] Notebook: CSV, señal, costos y las dos curvas separándose apenas.

Cierro con la frase de la lección: el bruto es marketing, el neto es tu cuenta, y el sofá es tu benchmark. Nos vemos en el quiz. (2:50)

[VISUAL 2:50] Cierre: "El neto manda." + CTA al quiz.
