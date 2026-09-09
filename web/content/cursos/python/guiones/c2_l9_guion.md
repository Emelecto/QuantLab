# C2-L9 — Proyecto: pipeline end-to-end que dice que no (guion, ~5 min)

[VISUAL 0:00] Portada: un pipeline de cinco etapas que termina en un sello rojo gigante: "NO OPERAR": "Mi proyecto favorito es el que me ahorró dinero".

Llegamos al proyecto final y te traigo una historia con final infeliz, que es la más valiosa del curso. Armé el pipeline completo sobre noventa días de ETH: carga, señal, costos, métricas y walk-forward. El activo terminó plano, menos cero coma uno. La estrategia perdió menos dieciocho por ciento. Y el veredicto, escrito con orgullo, dice: no operar. (0:25)

[VISUAL 0:25] Curva de ETH plana como una mesa mientras el equity de la estrategia serrucha hacia abajo.

Primero, qué es un pipeline de verdad. Cinco etapas: cargas los noventa cierres; generas la señal SMA diez-treinta con su shift, sin mirar el futuro; restas cinco bps por trade; mides retorno, Sharpe y caída; y corres el walk-forward de tres ventanas. La prueba de fuego: si cambias un número y no se recalcula todo solo, no tienes un pipeline, tienes un cuaderno de recortes. (0:55)

[VISUAL 0:55] Cinco bloques en fila iluminándose en orden, con un engrane girando.

Los números del examen. Cuatro trades, bruto menos dieciocho, neto menos dieciocho coma diecisiete, Sharpe menos 2,87, caída menos dieciocho coma siete. ¿Qué pasó? Un cruce de medias en un mercado lateral sin tendencia es una máquina de serruchos: compra caro, vende barato, con disciplina admirable. Y cada diente del serrucho paga cinco bps. (1:25)

[VISUAL 1:25] Sierra cortando una tabla plana, cada diente soltando una monedita.

Y el walk-forward remata. Ventana uno: dentro menos cero coma uno, fuera más 4,56, una mejora que nadie habría apostado. Ventana dos: la elegida no opera en ningún lado, cero y cero. Ventana tres, la trampa bonita: dentro más 3,51, fuera cero, gap de 3,51. Si te enamoras de ese más 3,51 y la operas, el mercado te cobra la ingenuidad. Solo una de tres ventanas termina en positivo fuera. (1:55)

[VISUAL 1:55] Tres tarjetas: una sorpresa verde, una gris vacía, una estrella que se apaga.

Aquí está la lección que ningún tutorial te da: un pipeline que dice que no también es éxito. Te ahorró dinero real. El proyecto se entrega igual, con la frente en alto: números, gráfico, walk-forward y veredicto falsable. "No operaría este cruce en ETH; operaría si el OOS confirmara dos ventanas seguidas con gap chico". Sin esa frase, es una creencia; con ella, es una tesis. (2:25)

[VISUAL 2:25] Hoja de una página con el sello NO OPERAR y la frase falsable subrayada.

En el notebook vas a correr las cinco etapas tú: carga los noventa días, genera la señal, resta costos, mide, y lanza las tres ventanas del walk-forward. Cambia la rápida y la lenta y mira cómo el veredicto se recalcula solo. Ese es tu pipeline, y te lo llevas para siempre. (2:55)

[VISUAL 2:55] Notebook ejecutándose de arriba a abajo hasta el veredicto.

Cierro el curso con esto: el objetivo nunca fue encontrar la estrategia ganadora en estos datos. Fue construir la máquina que la encontraría si existiera, y que tendría el coraje de decir que no cuando no existe. Eso construiste. Nos vemos en el quiz final. (3:20)

[VISUAL 3:20] Cierre: "El 'no' también es éxito." + CTA al quiz.
