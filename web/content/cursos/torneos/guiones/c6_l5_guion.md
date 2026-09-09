# C6-L5 — Testnet demo antes de stake (guion, ~4 min)

[VISUAL 0:00] Portada: "Pilotos: primero el simulador" + cabina de simulación.

Ningún piloto vuela sin horas de simulador. Tu pipeline tampoco toca capital real sin su ensayo general: la demo con dinero de mentira. (0:12)

[VISUAL 0:12] Interruptor DEMO/REAL: mismo tablero, distinto dinero.

La demo ejecuta lo mismo que el real: generar la submission, validar su formato, puntuar por era. La única diferencia es el stake en cero. Si falla aquí, habría fallado con dinero. (0:40)

[VISUAL 0:40] Pipeline en cuatro bloques: generar → validar → puntuar → decidir, con "stake = 0".

En el notebook lo corres sobre 60 días y obtienes tu primer score demo por semanas. Hasta aquí, barato y revelador. (1:05)

[VISUAL 1:05] Score demo por semanas apareciendo como tabla del notebook.

Pero una semana verde no autoriza nada. El umbral: media mayor a 0.01 con 4 de las últimas 6 semanas en positivo. Exigente a propósito: la demo no cuesta, el real sí. (1:35)

[VISUAL 1:35] Regla en pantalla + ventanas de 6 semanas pasando o rebotando el corte.

Y mira el experimento del notebook: con el umbral laxo se cuelan ventanas malas. El umbral existe por algo. (2:00)

[VISUAL 2:00] Comparativa estricto vs laxo: el laxo dejando pasar semanas rojas.

Pasar a real no es graduarse: es empezar a vigilar. CORR dos semanas bajo cero o beta disparada, y de vuelta a demo sin drama. El prestigio no paga drawdowns. (2:30)

[VISUAL 2:30] Panel de monitoreo con alarma y flecha de retorno "REAL → DEMO".

Tu misión final del curso: corre el pipeline, cuenta cuántas ventanas pasan el corte y define tu regla de retorno. Pocas pasan, y esa es exactamente la idea. (3:00)

[VISUAL 3:00] Cierre: "La demo es tu simulador; el umbral, tu licencia." + CTA al quiz y al examen.
