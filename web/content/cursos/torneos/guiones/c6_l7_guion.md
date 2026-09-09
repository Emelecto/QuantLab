# C6-L7 — Post-mortem de torneo: pierde bien para ganar después (guion, ~5 min)

[VISUAL 0:00] Portada: 12 barras de rondas, 8 verdes y 4 rojas, con un sello "t = 2,29". Título "El post-mortem".

Doce rondas auditadas: Spearman neutral medio más 0,018, t de 2,29, ocho envíos y cuatro rondas donde lo profesional fue no enviar. El post-mortem convierte cada ronda —buena o mala— en una mejor decisión para la siguiente. (0:15)

[VISUAL 0:15] Tabla crudo vs neutral por ronda: el neutral cae ~0,005 siempre.

Primero, el mérito de quién es. El Spearman crudo mezcla tu señal con exposiciones: beta, sector, tamaño. Neutralizar es regresar tu predicción contra esas exposiciones y correlacionar el residuo. Aquí el neutral cae unas milésimas por ronda: esa diferencia era sesgo, no habilidad. Si tu neutral vive bajo 0,01, no tienes modelo de torneo: tienes un ETF con pasos extra. (1:10)

[VISUAL 1:10] Fórmula del t-stat animada: media dividida por (desviación sobre raíz de 12).

Segundo, ¿señal o ruido? Doce rondas con media más 0,018 y t de 2,29: la señal supera dos desviaciones del ruido. Regla práctica: t mayor a 2 para creer, mayor a 3 para stakear fuerte. Una ronda con más 0,06 no significa nada sola; el post-mortem solo habla con el conjunto. (2:10)

[VISUAL 2:10] Umbral de envío +0,01: 8 barras lo superan, 4 quedan fuera en rojo.

Tercero, el veredicto. Neutral sobre 0,01 y costos cubiertos: se envía con stake proporcional a la convicción. Ronda floja: no se envía, stake cero, y el porqué queda escrito. Cuatro descartes que ahorraron stake y reputación, porque el ranking premia la consistencia, no el presentismo. (3:00)

[VISUAL 3:00] Sello "NO ENVIAR" sobre 4 rondas + ahorro de stake.

El error clásico: celebrar una gran ronda y triplicar el stake en la siguiente. El que ajusta el stake por ronda suelta está haciendo trading con su ego. En el notebook vas a calcular media, t-stat y veredictos, y a probar qué pasa si subes el umbral a +0,02. Nos vemos en la 8, donde instalas tu ética y tu freno. ¡A por el QP! (3:50)

[VISUAL 3:50] Notebook: t-stat + veredictos + CTA al quiz c6_l7.json.
