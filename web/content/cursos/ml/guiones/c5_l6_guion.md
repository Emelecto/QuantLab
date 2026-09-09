# Guion C5-L6 · Stacking con OOF (4 min)

> Tono: cercano, como explicándole a un colega. Ritmo pausado en las ideas clave.

**[VISUAL 0:00]** Portada: dos cerebros mediocres + un juez. Título "Stacking con OOF".

Hola, hoy vamos a combinar modelos sin hacer trampa. Tienes un Ridge estable y un boosting nervioso: cada uno gana en tramos distintos. Esa diversidad es oro, si la mezclas bien.

**[VISUAL 0:35]** Tabla: accuracy por tramo, Ridge gana unos, GBM otros.

El error clásico: entrenar al meta-modelo con predicciones in-sample. Las bases ya memorizaron el train, así que el meta aprende a confiar en su memoria. En vivo, se derrumba. Lo he visto más veces de las que quiero admitir.

**[VISUAL 1:10]** Diagrama animado: train partido en 5 pliegues, cada tramo predicho a ciegas.

La cura se llama out-of-fold. Partes el train en cinco, predices cada tramo con un modelo que no lo vio, y apilas esas predicciones honestas como features del meta. Y ojo: sin shuffle, que son series temporales y el orden es sagrado desde la lección 2.

**[VISUAL 2:00]** Código: el loop KFold + LogisticRegression como meta. Pantalla del notebook corriendo.

Luego reentrenas las bases en todo el train, congelas el meta y mides en el 30% final que nadie tocó. Ridge, boosting y stack lado a lado, sin piedad.

**[VISUAL 2:50]** Barras comparando accuracy OOS de los tres. El stack empata o gana por poco.

¿Y si el stack solo empata? Normal. El stacking estabiliza, no hace magia: empatar con menos varianza también es ganar. Y si ni eso, quédate con lo simple. Esa honestidad te va a ahorrar muchos disgustos.

**[VISUAL 3:30]** Checklist en pantalla + quiz c5_l6.json.

Practica: cambia el meta por un promedio simple y mira cuánto aporta el LogReg. Nos vemos en la 7, donde los costos muerden. ¡A por el QP!
