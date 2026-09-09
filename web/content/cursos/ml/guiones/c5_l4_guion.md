# C5-L4 — Ridge vs LightGBM (guion, ~4 min)

[VISUAL 0:00] Portada: "Lineal vs bestia" — una línea recta serena frente a un bosque de árboles.

Lineal contra árboles: en mercados ruidosos el modelo simple suele ganar, y cuando pierde, pierde por razones que puedes medir. Duelo honesto hoy. (0:12)

[VISUAL 0:12] Ring de boxeo: "Ridge" vs "LightGBM", campana.

Ridge es un lineal con freno: penalización L2 que impide que cualquier coeficiente se dispare por ruido. Con pocos datos financieros, esa humildad paga. (0:35)

[VISUAL 0:35] Coeficientes salvajes siendo domados por un freno "alpha".

LightGBM, en cambio, es boosting de árboles: caza no linealidades e interacciones, pero pide más datos y más disciplina. Sin walk-forward y sin costos, te vende humo con excelente R². (1:00)

[VISUAL 1:00] Árboles ramificándose sobre los datos, con advertencia "hambre de datos".

En el notebook, ocho features de mercado —rango, volumen, lags, momentum— y embargo antes del test. Si no hay LightGBM instalado, entra su primo de sklearn automáticamente: la comparación sigue valiendo. (1:30)

[VISUAL 1:30] Tabla de features + mensaje de fallback honesto en el notebook.

Y decidimos con Sharpe neto, no con accuracy: posición por signo predicho menos costos por cada cambio de lado. El mejor R² no siempre da el mejor P&L — y el P&L es lo que comes. (2:00)

[VISUAL 2:00] Balanza: "R²" liviano vs "Sharpe neto" pesando billetes.

Mira el resultado con ojos adultos: ambos Sharpes salen negativos en este tramo. Eso también es una respuesta: a veces el ganador es "no operar". Un backtest honesto que dice "no" vale oro. (2:30)

[VISUAL 2:30] Semáforo en rojo: "no operar también es una señal".

Tu misión: mueve el costo y el alpha de Ridge y encuentra dónde cambia el ganador. Quien decide por Sharpe neto deja de coleccionar modelos bonitos. Lección 5: redes. (2:55)

[VISUAL 2:55] Cierre: "Que gane el P&L, no el R²." + CTA al quiz.
