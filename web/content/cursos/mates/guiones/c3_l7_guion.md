# C3-L7 — Overfitting y validación fuera de muestra (guion, ~4 min)

[VISUAL 0:00] Portada: un trofeo brillante etiquetado "Sharpe +2,89" que al girar muestra por detrás "−0,06"; título "El examen real".

Te presento la estrategia perfecta: Sharpe de más 2,89. Y te presento la misma estrategia un mes después: menos 0,06. No cambió el mercado. Cambió que se acabó la trampa. Hoy hablamos de overfitting y del único antídoto: la validación fuera de muestra. (0:20)

[VISUAL 0:20] Misma curva partida en dos: primer tramo subiendo hermoso, segundo plano; etiquetas "IS" y "OOS".

Overfitting es memorizar en vez de aprender. Ajustas parámetros hasta que el backtest brille, y con pocos datos y muchos botones que mover, siempre existe una combinación perfecta por puro azar. Es como estudiarte solo las respuestas del examen pasado: diez en el simulacro, reprobado en el real. (0:55)

[VISUAL 0:55] Estudiante memorizando respuestas frente a un examen con preguntas nuevas; etiqueta "overfitting".

El protocolo es simple y sagrado. Separas los datos antes de optimizar: treinta días para ajustar, veinte bajo candado para evaluar. El bloque bajo candado se toca una sola vez, al final. Aquí el veredicto es brutal: menos 0,06, indistinguible de cero. (1:25)

[VISUAL 1:25] Caja fuerte etiquetada "OOS: abrir una sola vez" con un candado.

Y ojo con la trampa elegante: mirar el OOS, ajustar un poquito, volver a mirar. Eso ya no es fuera de muestra, es muestra con pasos extra. El candado se abre una vez, no una vez por semana. (1:55)

[VISUAL 1:55] Mano abriendo la caja una y otra vez hasta que el candado se rompe; cruz roja.

¿Cómo leer el resultado? Muestra más 2,89 contra fuera de muestra menos 0,06: brecha de casi tres puntos, firma del overfitting severo, estrategia descartada. Un resultado sano sería el OOS positivo conservando al menos la mitad del IS. Sin confirmación fuera de muestra, ningún Sharpe de muestra vale nada. (2:30)

[VISUAL 2:30] Barras IS gigante vs OOS plana; sello rojo "DESCARTADA".

En el notebook partes los cincuenta días con la columna split, calculas el Sharpe en cada bloque con el mismo código y dictas el diagnóstico con números, no con opiniones. (3:00)

[VISUAL 3:00] Notebook: split IS/OOS, dos Sharpes y la brecha calculada.

Cierro con la frase: todo backtest brilla en los datos donde nació; el examen real son los datos que nunca vio. Nos vemos en el quiz. (3:20)

[VISUAL 3:20] Cierre: "El examen real." + CTA al quiz.
