# C1-L2 — Retornos simples y logarítmicos (guion, ~4 min)

[VISUAL 0:00] Portada: velocímetro sobre un gráfico de precios.

Te confieso algo: durante meses yo medía mal la velocidad del mercado. Miraba precios y promediaba porcentajes como si nada. Hasta que un +50% seguido de un −50% me dejó con la cuenta temblando. (0:15)

[VISUAL 0:15] Animación: 100 → 150 → 75, con cara de sorpresa.

El precio te dice dónde estás. El retorno te dice qué tan rápido te mueves. Y hay dos formas de medirlo. (0:28)

[VISUAL 0:30] Dos tarjetas: "Simple: para contar" vs "Log: para calcular".

El retorno simple es el de toda la vida: (final menos inicial) entre inicial. De 100 a 110, un 10%. Perfecto para contarle a alguien cómo te fue. (0:45)

[VISUAL 0:45] Ejemplo numérico grande en pantalla: (110−100)/100 = 10%.

Pero tiene una trampa: no se puede sumar. Mi ejemplo doloroso: sube 50%, baja 50%. Tu cabeza dice "tablas". Tu cuenta dice 75. Perdiste un cuarto del dinero "empatando". (1:10)

[VISUAL 1:10] Barras animadas mostrando el encadenamiento 1.5 × 0.5 = 0.75.

Aquí entra mi herramienta favorita, el retorno logarítmico: logaritmo natural de final entre inicial. Suena fancy, pero hace una sola magia que lo justifica todo: los logs de días seguidos se suman. (1:40)

[VISUAL 1:40] Ecuación simple: r_total = r1 + r2 + r3, con bloques apilándose.

Y un detalle que me encanta: cuando los movimientos son chiquitos, como el 1% diario, el simple y el log son casi gemelos. Se separan solo en movimientos grandes, y ahí el honesto es el log. (2:05)

[VISUAL 2:05] Curvas superpuestas que coinciden cerca del cero y divergen en los extremos.

Mi flujo de trabajo, por si te sirve: calculo todo en log —series largas, promedios, modelos— y al final convierto a porcentaje simple para contar la historia. Calcular en uno, reportar en otro. (2:30)

[VISUAL 2:30] Esquema: CSV → log → análisis → % simple para el reporte.

El error que más veo: promediar retornos simples y multiplicar por 252 para anualizar, sin pensar en composición. Con volatilidad alta ese número te miente con total confianza. (2:55)

[VISUAL 2:55] Sello rojo: "promedio simple × 252 ≈ peligro".

En el notebook lo vas a comprobar con precios reales de juguete: calculas ambos, sumas los logs y caes justo en el retorno total. Cuando lo veas cuadrar, se te queda para siempre. (3:15)

[VISUAL 3:15] Notebook: la suma de logs igualando al total, check verde.

Haz el quiz —son 4 preguntas— y nos vemos en la lección 3. (3:30)

[VISUAL 3:30] Cierre + CTA al quiz y al notebook.
