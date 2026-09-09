# C2-L7 — Walk-forward: seis exámenes, una sola robusta (guion, ~4 min)

[VISUAL 0:00] Portada: un examen partido en seis pedazos, cinco tachados y uno con estrella: "La ganadora casi nunca repite".

La lección pasada te dejó un cruce que gana en bruto, empata en neto y pierde contra el sofá. Hoy lo sometemos a la prueba que separa la investigación del autoengaño: el walk-forward. Seis ventanas, seis exámenes, cero segundas oportunidades. Spoiler: solo una ventana sale robusta. (0:20)

[VISUAL 0:20] Seis tarjetas de examen cayendo en fila sobre la mesa.

El protocolo es simple y cruel. Cada ventana entrena en cincuenta días: prueba nueve combinaciones de medias y elige la de mejor Sharpe. Después rinde en los quince días siguientes, que nunca vio. Entrena aquí, rinde allá. Un detalle técnico elegante: el examen usa contexto trailing, porque las medias necesitan historia, pero la elección del parámetro jamás toca el futuro. (0:50)

[VISUAL 0:50] Diagrama: bloque de 50 días "entrena y elige", flecha a bloque de 15 "rinde", candado en el medio.

Y aquí viene lo sabroso: la ganadora rota. Ventana uno elige quince-cuarenta. La dos y la tres, cinco-treinta. La cuatro, cinco-veinte. La cinco, quince-treinta. Si el parámetro óptimo baila con la ventana, no existe el parámetro óptimo: existen regímenes de mercado. Perseguir al campeón del último tramo no es adaptarse, es overfitting con disfraz de adaptación. (1:15)

[VISUAL 1:15] Trofeo pasando de mano en mano entre ventanas, cada una con pareja distinta.

El marcador final. La ventana dos es la alumna ejemplar: más 3,27 dentro, más 4,23 fuera, hasta mejora en el examen. La ventana cuatro es la pesadilla: más 2,67 dentro que se vuelve menos 5,54 fuera, un gap de 8,21. La ventana uno ni siquiera opera en su tramo: lo mejor que encontró fue quedarse quieta, y aun así pierde fuera. Tres de seis terminan en positivo fuera, pero solo una combina positivo con gap chico. Gap medio del experimento: más 1,66. (1:45)

[VISUAL 1:45] Gráfico IS vs OOS: W2 arriba a la derecha con estrella, W4 despeñándose abajo.

Y un aviso para tramposos, incluyéndome a mí del pasado: si ves el OOS y re-optimizas el grid hasta que cuadre, convertiste el examen en otro entrenamiento. Eso se llama teatro, no validación. Los parámetros del test se congelan antes del test; si el OOS duele, se anota, no se rebusca. (2:10)

[VISUAL 2:10] Mano moviendo la cerca del examen hasta que su favorita aprueba, tachado en rojo.

En el notebook vas a cargar las seis ventanas, verificar que el gap es IS menos OOS en cada fila y pintar el gráfico. Busca la W2, mira cómo vive pegada a la diagonal, y luego mira la W4. Esa distancia a la diagonal es todo lo que necesitas aprender a leer. (2:30)

[VISUAL 2:30] Notebook: tabla de ventanas y scatter IS vs OOS apareciendo.

Frase para llevarte: optimizar en todo el pasado y rezar es overfitting con pasos extra. Nos vemos en el quiz. (2:50)

[VISUAL 2:50] Cierre: "El gap manda." + CTA al quiz.
