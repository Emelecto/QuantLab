# C2-L5 — Tu primer cliente de Binance (guion, ~5 min)

[VISUAL 0:00] Portada: logo Binance + grifo llenando un DataFrame: "Datos reales, cero registro".

Hasta hoy jugaste con CSV de juguete. Hoy traes velas reales de Binance con una llamada, sin API key ni registro. (0:12)

[VISUAL 0:12] Terminal: `requests.get` a /api/v3/klines, JSON crudo apareciendo.

El endpoint es `/api/v3/klines`: le pasas símbolo, intervalo y límite, y te devuelve una lista de velas. Público, gratis, hasta mil velas por llamada. Para más historia se pagina con fechas, pero con cincuenta nos basta. (0:45)

[VISUAL 0:45] URL con params resaltados: symbol=BTCUSDT, interval=1d, limit=50.

Pero ojo: lo crudo no se come. Los precios llegan como texto y el tiempo en milisegundos. Dos conversiones —`astype(float)` y `to_datetime(unit='ms')`— y esa lista se vuelve un DataFrame limpio y ordenado. Sin esto, el gráfico sale vacío y el promedio concatena texto. (1:20)

[VISUAL 1:20] Antes/después: JSON de strings → DataFrame tipado, dtypes en verde.

Tercer paso: envuélvelo en `get_klines()` con try/except. Si hay red, trae lo fresco; si no, lee el CSV demo. Esta función te acompaña todo el curso: en la lección 6 el backtest la usa para traer precios. Escríbela una vez, úsala siempre. (2:00)

[VISUAL 2:00] Código de get_klines con rama API y rama fallback, diagrama de flujo.

Y valida como profesional: que high sea el máximo, que low sea el mínimo, que las fechas vayan en orden. Tres asserts que te ahorran horas de cazar gráficos absurdos. En el notebook ya vienen puestos. (2:35)

[VISUAL 2:35] Asserts en verde pasando: high/low/orden chequeados.

Aviso de veterano: al paginar con `startTime`, las velas pueden llegar desordenadas. Siempre `sort_values` al final, o tu `pct_change` calcula basura con total confianza. Lo viste en la lección 3, aquí muerde de verdad. (3:05)

[VISUAL 3:05] Velas desordenadas → retornos absurdos → sort → retornos correctos.

Tu misión: cambia el símbolo a ETHUSDT y el intervalo a `1h` en el notebook. Mira qué cambia en el DataFrame y piensa qué estrategias piden velas horarias en vez de diarias. En la 6, estos datos alimentan tu primer backtest. (3:40)

[VISUAL 3:40] Cierre: "Del grifo al DataFrame." + CTA al quiz.
