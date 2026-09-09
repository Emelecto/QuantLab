# Guion C5-L7 · Costos: 2 bps + slippage (3 min)

> Tono: directo, con un punto de humor contable. El dinero duele y se nota.

**[VISUAL 0:00]** Portada: P&L bruto sonriente vs P&L neto llorando. Título "2 bps + slippage".

Tu backtest bruto dice que ganas. Tu cuenta dice que no. ¿Quién miente? Ninguno: te faltan los costos. Hoy los modelamos en serio.

**[VISUAL 0:30]** Fórmula en grande: costo = turnover × (0,0002 + ¼ del rango).

Dos piezas. Comisión fija de 2 bps por cambio de posición, y slippage aproximado como un cuarto del rango high-low: cruzar el spread cuesta, y en velas amplias cuesta más. Y la clave: solo pagas cuando te mueves. Quieto, no pagas.

**[VISUAL 1:05]** Notebook: curva del P&L bruto vs neto separándose trade a trade.

Mira el puente: hit-rate del 55%, Sharpe bruto atractivo… y el neto por los suelos. El turnover diario multiplica el costo hasta devorar el margen. Reporta siempre bruto, neto y número de trades juntos: si el Sharpe cae a la mitad al netear, operas demasiado.

**[VISUAL 1:50]** Filtro por umbral: trades marginales tachados en rojo.

El remedio es un umbral de convicción: solo un giro fuerte del momentum cambia tu posición (0,006); si no, la mantienes. Sacrificas un poco de bruto, la rotación se desploma y el neto sube. Opera menos, quédate más.

**[VISUAL 2:25]** Regla de oro en pantalla: "edge por trade > costo por trade, o es donación".

**[VISUAL 2:40]** Comparativa antes/después del filtro: trades 7→5, neto sube.

Grábate esto: si tu edge por trade no supera a tu costo por trade, no tienes estrategia, tienes una donación al mercado. Practica moviendo el umbral y encuentra tu punto dulce. Quiz y nos vemos en deployment.
