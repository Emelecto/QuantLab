# C4-L2 — Stop-loss y take-profit OCO (guion, ~4 min)

[VISUAL 0:00] Portada: dos puertas, "STOP −1R" y "TAKE +2R", con un guardia OCO.

Un trade sin salida planeada no es un plan: es una esperanza con comisión. Hoy atas tu stop y tu take con una orden OCO para que el trade se gestione solo. (0:12)

[VISUAL 0:12] Ticket de orden con tres precios: entrada, stop, take conectados.

Las cuentas son simples: riesgo es entrada menos stop, beneficio es take menos entrada, y el RR es el cociente. En nuestro CSV el RR medio es dos: cada ganadora paga dos perdedoras. (0:40)

[VISUAL 0:40] Trade 1 desglosado: 655,91 de riesgo vs 1.301,13 de beneficio → RR 1,98.

OCO significa una cancela la otra. Toca el stop y el take muere; toca el take y el stop muere. Sin OCO dejas una orden huérfana que opera sin ti mientras duermes. (1:10)

[VISUAL 1:10] Animación: precio toca el stop, la orden take se rompe en pedazos.

Aquí viene la matemática incómoda: con RR de dos, tu punto de equilibrio es treinta y tres por ciento. Puedes perder dos de cada tres y seguir a flote. El sistema no necesita que tengas razón siempre, solo que respetes el ratio. (1:45)

[VISUAL 1:45] Balanza: 1 win de +2R equilibrando 2 losses de −1R.

El pecado capital es mover el stop "para darle aire" cuando el precio se acerca. Eso destruye el RR y convierte un sistema ganador en una máquina de perder. El stop se pone con análisis, no con esperanza. (2:15)

[VISUAL 2:15] Mano arrastrando el stop hacia abajo + equity desplomándose.

En el notebook replicas riesgo, beneficio y RR en cincuenta trades y calculas winrate y expectancy. Si la expectancy es positiva, tienes un negocio; si no, tienes un hobby caro. (2:45)

[VISUAL 2:45] Notebook: winrate, breakeven y expectancy impresos.

Tu misión: revisa tu último mes y calcula tu RR real, no el planeado. La diferencia entre ambos es lo que te está costando la indisciplina. (3:05)

[VISUAL 3:05] Cierre: "El stop te saca del error, el take de la codicia." + CTA al quiz.
