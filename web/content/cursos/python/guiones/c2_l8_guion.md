# C2-L8 — Grid search y sizing: Kelly pide locuras (guion, ~4 min)

[VISUAL 0:00] Portada: una fórmula elegante que escupe un número absurdo "¡apuesta 10 veces tu cuenta!": "Kelly no está mal, está desnudo".

Hoy barremos doce combinaciones de medias y rankeamos por Sharpe. La ganadora es la cinco-cincuenta con Sharpe de 2,28 y más cincuenta por ciento anual. Suena a fiesta. Hasta que preguntas cuánto apostar y Kelly te responde: diez veces tu cuenta. (0:20)

[VISUAL 0:20] Ranking del grid con la (5,50) en el podio y confeti que se congela.

El grid es lo metódico: mismas reglas honestas de siempre, señal con pasado, cinco bps por trade, doce parejas de rápida por lenta. El top lo dominan las lentas de cincuenta; las rápidas pelean abajo. Siete combinaciones pasan el corte de Sharpe mayor a uno, cinco quedan débiles. Y aquí va el golpe bajo con cariño: tu querida diez-treinta de la lección seis marca 0,94 y queda fuera. En su ventana funcionó; en el grid completo no entra al top. El contexto manda. (0:50)

[VISUAL 0:50] Barras del grid ordenadas con la línea de corte; la (10,30) justo debajo, en gris.

Ahora el sizing, que es la mitad del trabajo que nadie quiere hacer. Kelly dice f igual a mu sobre varianza: la fracción óptima para maximizar el crecimiento. Para la ganadora sale 10,4. Mil cuarenta por ciento de tu cuenta. Y no es un error: las doce piden entre dos y media y diez veces la cuenta. Kelly asume que conoces la media y la varianza de verdad, y que toleras caídas del noventa por ciento en el camino. Tú no conoces lo primero ni toleras lo segundo. (1:20)

[VISUAL 1:20] Ruleta con una ficha gigante marcada "10,4×" tambaleándose al borde.

Entonces cambiamos la pregunta. En vez de cuánto maximiza, preguntamos cuánto me deja dormir: escala cada estrategia para que su volatilidad anual sea quince por ciento. La ganadora, con vol de veintidós, queda en 0,68 de la cuenta. Las doce quedan entre 0,58 y 0,70. Fíjate en la magia: el objetivo de riesgo empareja lo que el Sharpe separa. El sizing convierte edges distintos en apuestas comparables. (1:50)

[VISUAL 1:50] Doce apuestas de tamaños distintos encogiéndose hasta quedar parejas bajo la etiqueta "15% vol".

El error clásico es operar Kelly completo, o peor, apalancarlo porque confías. Los cementerios de cuentas están llenos de gente con la fórmula correcta y el tamaño equivocado. Si tu sizing no sobreviviría a que tu media estimada esté a la mitad, no es sizing: es esperanza. (2:15)

[VISUAL 2:15] Lápida que dice "Aquí yace una cuenta con Kelly completo".

En el notebook vas a cargar el grid, encontrar la mejor, comparar el Kelly pedido contra el tamaño por volatilidad y pintar Sharpe contra drawdown. Hazlo tú: busca tu diez-treinta y mírala en gris. Duele, y por eso enseña. (2:35)

[VISUAL 2:35] Notebook: tabla ordenada y scatter Sharpe vs drawdown.

Cierro: encontrar el parámetro es la mitad; no arruinarte operándolo es la otra. Nos vemos en el quiz. (2:55)

[VISUAL 2:55] Cierre: "Kelly es brújula, no orden de compra." + CTA al quiz.
