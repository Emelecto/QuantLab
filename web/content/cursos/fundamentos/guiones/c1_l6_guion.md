# C1-L6 — Sesgos y overfitting: la auditoría de las 20 variantes (guion, ~4 min)

[VISUAL 0:00] Portada: veinte trofeos, diecinueve de cartón: "El campeón casi nunca repite".

Te cuento cómo me quemé la primera vez: probé un montón de variantes de un cruce de medias, encontré una con un Sharpe espectacular y ya me veía celebrando. La puse a andar con datos nuevos y se desinfló en semanas. No era una estrategia, era suerte con buen maquillaje. (0:15)

[VISUAL 0:15] Yo abrazando un trofeo gigante que se derrite y queda en charco.

El experimento de hoy es justo ese, pero a propósito: veinte combinaciones de media rápida y lenta, cada una con su Sharpe dentro de muestra y fuera de muestra. Nueve salen robustas, diez débiles y una sobreajustada. Menos de la mitad sobrevive al contacto con datos que no vio antes. (0:40)

[VISUAL 0:40] Tabla de 20 filas tiñéndose de verde y rojo, marcador "9 de 20 sobreviven".

Mira los dos casos que duelen. La (3,15) marca 2,01 dentro y menos 0,56 fuera: sobreajustada de manual, gap de 2,57. Y la campeona, la (10,30) con 2,47 dentro, cae a 1,32 fuera con gap de 1,16: veredicto débil. Si pruebas suficientes variantes, alguna va a ligar dentro por puro azar. Eso no es mala suerte, es aritmética. (1:05)

[VISUAL 1:05] Barras IS altas hundiéndose en OOS: (3,15) y (10,30) desplomándose.

La pregunta correcta nunca es cuál ganó dentro, sino cuánto se degradó fuera. Las robustas no brillan más, se caen menos. La (8,35) pasa de 1,42 a 1,28 con gap de 0,13. La (4,18) clava 0,90 en ambas, gap cero. Hasta hay una que en dentro pierde y fuera gana, y nadie la habría elegido mirando solo el ranking. El Sharpe de dentro ordena el ruido; el gap dice la verdad. (1:30)

[VISUAL 1:30] Barras gemelas casi iguales para (8,35) y (4,18), sello "gap chico".

Y aquí va el checklist que uso antes de creerme cualquier backtest, el mío o el ajeno. Separa dentro y fuera antes de mirar nada, y no muevas esa frontera después. Decide pocas variantes de antemano, porque cada una extra es otra chance de ligar por azar. Exige un fuera decente, no un dentro espectacular. Desconfía si el gap pasa de un punto de Sharpe. Y repite en otra ventana u otro activo: lo que solo funciona en un dataset es una anécdota, no una estrategia. Ah, y resta comisiones y deslizamiento antes de celebrar. (1:55)

[VISUAL 1:55] Checklist de seis puntos tachándose uno por uno en una libreta.

El error clásico es mover la ventana de fuera hasta que tu favorita cuadre. Eso no es validar, es pescar el ruido con otro anzuelo. La frontera se fija una vez, al principio, y no se toca. (2:20)

[VISUAL 2:20] Mano moviendo una cerca una y otra vez hasta que el caballo "gana", tachado en rojo.

En el notebook vas a cargar el CSV de las veinte variantes, calcular el gap de cada fila y pintar el gráfico de barras dentro contra fuera. Hazlo tú: busca la (10,30), mira cómo se hunde, y luego encuentra las que apenas se mueven. Esa estabilidad es lo que estás aprendiendo a reconocer. (2:45)

[VISUAL 2:45] Notebook: CSV, cálculo del gap y barras IS vs OOS apareciendo.

Regla para llevarte: un Sharpe alto dentro con gap grande es una confesión, no un logro. (3:10)

[VISUAL 3:10] Cierre: "El gap manda." + CTA al quiz.
