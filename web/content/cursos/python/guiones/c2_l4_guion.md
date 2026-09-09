# C2-L4 — Gráficos que duelen (guion, ~4 min)

[VISUAL 0:00] Portada: equity subiendo + sombra roja bajo los picos: "¿Cuánto dolió ganar?".

Un backtest sin gráfico es un rumor. Hoy aprendes el gráfico que separa a los aficionados de los que sobreviven: el underwater. (0:12)

[VISUAL 0:12] Dos paneles matplotlib: precio arriba, equity abajo, mismo eje X.

Primer paso, lo simple: precio arriba, tu equity abajo, compartiendo fechas. Si el equity sube mientras el precio lateraliza, tu estrategia aporta algo. Si solo copia al mercado, no tienes estrategia, tienes beta. (0:45)

[VISUAL 0:45] Equity plano vs precio lateral: "beta disfrazada" tachado.

Ahora el plato fuerte: el pico es tu mejor momento hasta cada día —`cummax`—, y el drawdown es cuánto caíste desde ahí. Siempre cero o negativo. Su mínimo es tu peor día como trader: el max drawdown. (1:15)

[VISUAL 1:15] Animación: línea de pico escalonada + equity cayendo debajo, fórmula drawdown.

Y lo pintas como área bajo cero, en rojo. Cada mancha es una racha de sufrimiento: ves de un vistazo cuándo empezó, qué tan honda fue y cuánto tardó en recuperarse. Un número te dice el tamaño; el gráfico te dice el dolor. (1:50)

[VISUAL 1:50] Underwater rojo llenándose bajo el cero, max drawdown marcado con flecha.

¿Matplotlib o plotly? Para el reporte, matplotlib: PNG limpio y rápido. Para investigar, plotly: pasas el mouse y ves fecha y valor exacto de cada caída. Nosotros hacemos los dos en el notebook. (2:20)

[VISUAL 2:20] Mismo gráfico en plotly con hover y zoom activos.

Aviso de veterano: el drawdown se calcula sobre tu equity, no sobre el precio. El precio es el mercado; el equity es tu cuenta. Confundirlos es el error más común y el más caro de leer mal. (2:50)

[VISUAL 2:50] Dos curvas: drawdown sobre precio vs sobre equity, divergiendo; check en la correcta.

Tu misión: encuentra en qué fecha cayó el max drawdown y cuenta cuántas velas tardó en recuperar el pico. Si tardó media muestra, pregúntate si aguantarías eso con dinero real. Nos vemos en la 5, donde traemos datos de verdad. (3:20)

[VISUAL 3:20] Cierre: "El número mide; el gráfico duele." + CTA al quiz.
