# C3-L4 — Volatilidad y ATR (guion, ~4 min)

[VISUAL 0:00] Portada: stop del 2% siendo barrido por una vela gigante; "donación al mercado".

Un stop fijo del 2% en un activo que respira 5% al día no es gestión de riesgo: es una donación al mercado. Hoy aprendes a medir su respiración y a poner stops con criterio. (0:12)

[VISUAL 0:12] Gráfico con respiración animada (bandas expandiéndose y contrayéndose).

Primer instrumento: la volatilidad realizada. Desviación estándar de log-retornos, anualizada con raíz de 365 —porque crypto no duerme fines de semana—. Sin anualizar, no compares nada con nada. (0:40)

[VISUAL 0:40] Fórmula vol_anual = vol_diaria × √365 con calendario de 365 días.

BNB respira ~2–3% diario, o sea ~40–55% anual. Ese es tu presupuesto de movimiento: cualquier stop menor que la vol diaria vive dentro del ruido. Y vivir en el ruido sale caro. (1:05)

[VISUAL 1:05] Stop diminuto dentro de la zona de ruido siendo tocado; velocímetro de vol en rojo.

Segundo instrumento: el ATR. El True Range toma el máximo entre el rango del día y los gaps contra el cierre previo —porque lo que pasa entre velas también cuenta—. Su promedio de 14 días es el latido del activo en dólares. (1:35)

[VISUAL 1:35] Vela con gap: flechas high−low, high−prev, low−prev; la mayor se ilumina como TR.

Y ahora la jugada: stop a k × ATR, con k entre 2 y 3. ATR de 15, k de 2: tu stop vive 30 dólares bajo la entrada, fuera del ruido. ¿No cabe en tu riesgo? Reduces tamaño. Nunca achicas el stop. (2:05)

[VISUAL 2:05] Perro con correa: correa corta (stop 0.5×ATR, tirones) vs correa 2×ATR (paseo tranquilo).

Porque —grábalo— el riesgo lo fija el tamaño de posición, no la cercanía del stop. Un stop pegado no te hace conservador: te hace líquidable con el mismo riesgo. Primero el stop técnico, después el tamaño. Nunca al revés. (2:30)

[VISUAL 2:30] Misma cuenta, dos stops: el pegado liquida 3 veces, el 2×ATR sobrevive; riesgo idéntico.

Tu misión: prueba k = 1, 2 y 3 en el notebook y cuenta cuántos días te habrían sacado. Ese número es tu tolerancia real, medida, no imaginada. Cierras el C3 sabiendo respirar con el mercado. (2:55)

[VISUAL 2:55] Cierre: "Mide la respiración. Pon el stop fuera del ruido." + CTA al quiz + fin del curso.
