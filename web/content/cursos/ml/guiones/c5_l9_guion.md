# Guion C5-L9 · Monitoreo: IC y drift (4 min)

> Tono: de médico cuantitativo. Serio en los umbrales, humano en las metáforas.

**[VISUAL 0:00]** Portada: un electrocardiograma que se aplana. Título "IC y drift".

Desplegaste. Felicidades. Ahora viene la pregunta incómoda: ¿sigue viva tu señal? Hoy le ponemos pulso y termómetro.

**[VISUAL 0:30]** Definición simple: IC = ¿tu señal ordena bien el futuro? Escala y ejemplo 0,07.

El IC es la correlación de rangos entre tu señal y el retorno siguiente. No le importan costos ni tamaños, solo el orden. Un 0,05–0,10 sostenido ya es respetable. Lo que manda es la persistencia, no el pico.

**[VISUAL 1:10]** Gráfico: IC global decente vs IC rolling cayendo a cero en las últimas semanas.

Pero el global miente por promediar: una señal muerta hace tres semanas aún muestra un global bonito. El rolling de 20 barras cuenta la historia viva. Cuando se aplana en cero, la muerte ya avisó por carta: degrada el tamaño antes de que el P&L te grite.

**[VISUAL 2:00]** Dos tarjetas: z-shift del rango 0,4 en verde, z-shift de lag_1 2,5 en rojo parpadeante.

Y el termómetro: el drift. Comparas cada feature en vivo contra su mundo de entrenamiento con un z-shift. Más de 1,5 y el mercado ya es otro: tu modelo opera fuera de casa.

**[VISUAL 2:50]** Semáforo operativo: verde opera, amarillo mitad, rojo apaga y reentrena.

Cierra con el semáforo: verde si IC y drift están sanos, amarillo si falla uno — reduces a la mitad —, rojo si fallan los dos: apagas y reentrenas con embargo. Y recuerda: IC, drift y P&L son tres preguntas distintas. No las mezcles.

**[VISUAL 3:30]** Checklist en pantalla + quiz c5_l9.json.

Practica con la ventana rolling y remata el quiz. ¡Curso casi cerrado!
