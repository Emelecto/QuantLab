# C3-L3 — Log-retornos con BNB (guion, ~4 min)

[VISUAL 0:00] Portada: "+10% y −10% = ¿0%? ❌ −1%" en letras grandes.

Subes 10%, bajas 10%… ¿quedas igual? No: quedas 1% abajo. Si eso te sorprende, este video te va a ahorrar dinero real. (0:12)

[VISUAL 0:12] Animación: 100 → 110 → 99, con el −1 resaltado.

Los retornos simples mienten al acumularse porque cada porcentaje se calcula sobre una base distinta. Y si promedias simples para proyectar crecimiento, sobreestimas. Es el error silencioso de los backtests caseros. (0:40)

[VISUAL 0:40] Backtest casero mostrando equity inflado vs equity real divergiendo.

Entra el log-retorno: el logaritmo del cociente de precios. Una línea de código, y con movimientos pequeños casi coincide con el simple. Pero tiene un superpoder: se suma. (1:05)

[VISUAL 1:05] Código `np.log(close / close.shift(1))` + flechas apilándose en una suma.

La suma de tus cincuenta logs diarios es exactamente el log del retorno total. No aproximado: exacto, al decimal doce. Por eso los modelos —volatilidad, regresiones, Monte Carlo— viven en log-espacio. (1:35)

[VISUAL 1:35] Bloques diarios apilándose y colapsando en una sola barra "retorno total".

La regla práctica es simple: para contar dinero —PnL, equity— usa simples. Para modelar, sumar y anualizar, usa logs. Cada uno en su tarea y nadie sale herido. (2:00)

[VISUAL 2:00] Dos carriles: "💵 contar → simples" vs "📐 modelar → logs".

En el notebook lo verificas con BNB real: cincuenta días, las dos columnas, y el assert que demuestra que la suma de logs clava el total. Cuando un assert te confirma la teoría, esa teoría ya es tuya. (2:30)

[VISUAL 2:30] Notebook corriendo, assert en verde: "OK".

Tu misión: compara el producto compuesto de simples contra la suma de logs en cincuenta días y mide la divergencia. Pequeña hoy, gigante en un año. Nos vemos en la lección 4. (2:55)

[VISUAL 2:55] Cierre: "Los simples cuentan. Los logs acumulan." + CTA al quiz.
