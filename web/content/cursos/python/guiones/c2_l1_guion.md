# C2-L1 — Tu laboratorio: venv, Jupyter y pandas (guion, ~4 min)

[VISUAL 0:00] Portada: "Tu cocina cuantitativa" + logo de Python y pandas.

Hola, bienvenido al curso de Python para trading. Yo soy quien te acompaña, y hoy montamos tu laboratorio. Sin esto, todo lo demás cojea. (0:12)

[VISUAL 0:15] Terminal: comando `python -m venv .venv` ejecutándose.

Primer paso: el entorno virtual. Es una caja de arena donde tus librerías viven aisladas. Un proyecto, un venv. Así evitas el "en mi máquina sí funcionaba". (0:35)

[VISUAL 0:35] Diagrama: dos proyectos con versiones distintas de pandas, sin pelearse.

Yo una vez actualicé pandas y se me rompieron tres estrategias a la vez. Tres. Desde entonces, venv siempre y un `requirements.txt` que diga exactamente qué versiones uso. (0:55)

[VISUAL 0:55] Archivo requirements.txt en pantalla, resaltado.

Segundo paso: Jupyter. Olvida el programa de arriba abajo: aquí conversas con los datos. Ejecutas una celda, miras, ajustas. Para análisis, no hay nada más rápido. (1:20)

[VISUAL 1:20] Notebook ejecutando celdas una por una, gráfico apareciendo.

Tercer paso: pandas. Todo gira alrededor del DataFrame: filas son observaciones, columnas son variables. Con cinco verbos —leer, inspeccionar, seleccionar, crear columnas, graficar— haces el 80% del trabajo. (1:50)

[VISUAL 1:50] Tabla animada: CSV entrando por un lado, DataFrame saliendo por otro.

Mira qué fácil: `read_csv`, `head`, `describe`… y ya sabes cuántos días tienes, cuánto vale en promedio y si hay algo raro. Luego un `plot` y el precio aparece. Ese momento en que tus datos se vuelven dibujo es mágico, no me digas que no. (2:20)

[VISUAL 2:20] Gráfico del cierre diario dibujándose punto a punto.

Un aviso de veterano: antes de dar un notebook por bueno, reinicia el kernel y ejecútalo entero. El 90% de los bugs fantasma son celdas corridas en desorden. (2:45)

[VISUAL 2:45] Botón "Restart & Run All" pulsado, todo en verde.

Y el error más tonto y más común: la ruta del CSV. Si pandas dice "file not found", no es pandas, eres tú. Imprime dónde estás parado y lista los archivos. Dos líneas que ahorran media hora. (3:10)

[VISUAL 3:10] Código mostrando `Path.cwd()` y el archivo apareciendo.

Tu misión: corre el notebook, cambia la columna a volumen y cuéntame qué ves. Nos vemos en la lección 2, donde los datos vienen sucios. Y vienen sucios siempre. (3:30)

[VISUAL 3:30] Cierre: "Un proyecto, un venv." + CTA al quiz.
