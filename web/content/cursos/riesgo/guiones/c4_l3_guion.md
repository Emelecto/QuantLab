# C4-L3 — Drawdown y Monte Carlo (guion, ~4 min)

[VISUAL 0:00] Portada: curva de equity subiendo con un valle rojo marcado "−4,6%".

Todo el mundo pregunta cuánto va a ganar. Los que sobreviven preguntan cuánto van a sufrir. Hoy mides tu peor racha antes de vivirla. (0:12)

[VISUAL 0:12] Equity del CSV: 10.000 → 11.586 con valles intermedios.

Partimos de cincuenta retornos diarios y reconstruimos el equity multiplicando uno más retorno, día a día. El peak es el máximo acumulado y el drawdown, la distancia al peak. Día tres: menos dos por ciento y el primer valle de menos dos coma treinta y cinco. (0:45)

[VISUAL 0:45] Código de tres líneas: equity, peak, drawdown + curva pintándose.

El número más honesto de tu sistema no es el retorno: es el máximo drawdown. Un más quince con menos cuatro coma seis se opera tranquilo; el mismo más quince con menos cuarenta se abandona a mitad. El drawdown mide si tu estrategia es humanamente operable. (1:20)

[VISUAL 1:20] Dos equities con igual final: una suave, otra con un cráter del −40%.

Y aquí entra Monte Carlo: tomas tus cincuenta retornos, los reordenas dos mil veces y miras el peor punto de cada camino. Sin inventar datos, descubres pasados alternativos donde tu peor caso visto no era el peor posible. (1:55)

[VISUAL 1:55] 2.000 hilos enredándose; el manojo hundido se ilumina en rojo.

Si el cinco por ciento de los caminos cae más de ocho, tu sizing es optimista y tu cuenta lo pagará. Ajustas el riesgo hoy, gratis, en vez de aprenderlo con dinero real. (2:25)

[VISUAL 2:25] Histograma de máximos drawdowns con línea en −5% y −8%.

El error típico es dimensionar por el retorno esperado e ignorar el drawdown. El que quiebra no es el que gana poco: es el que no sobrevive a su primer menos veinte apalancado. (2:50)

[VISUAL 2:50] Cuenta apalancada evaporándose en un −20%.

En el notebook encuentras el peor drawdown con su día exacto y estimas por simulación cuán frecuente es. Tu misión: corre el Monte Carlo y decide tu riesgo por trade mirando el histograma, no el optimismo. (3:10)

[VISUAL 3:10] Cierre: "El retorno promete, el drawdown cobra." + CTA al quiz.
