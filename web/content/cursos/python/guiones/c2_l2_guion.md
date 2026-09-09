# C2-L2 — Datos sucios, decisiones sucias (guion, ~4 min)

[VISUAL 0:00] Portada: "Los datos mienten" + tabla con celdas vacías parpadeando.

Te traigo malas noticias: el mercado no te entrega datos limpios. Te entrega feriados, cortes y horas muertas. Si analizas eso tal cual, tus métricas son ficción. (0:15)

[VISUAL 0:15] Serie temporal con huecos marcados en rojo.

Mi regla de oro, dos minutos que ahorran dos días: `info`, `isna().sum`, duplicados. Siempre, antes de cualquier análisis. Una vez calculé un Sharpe precioso sobre una serie con tres meses duplicados. Precioso y falso. (0:45)

[VISUAL 0:45] Código del chequeo forense con resultados en pantalla.

Hablemos de gaps. Tienes tres opciones honestas: eliminar, arrastrar el último valor o interpolar. Eliminar si son pocos; arrastrar si el mercado estaba cerrado; interpolar solo para curvas suaves, nunca para precios. (1:15)

[VISUAL 1:15] Tres tarjetas animadas: dropna / ffill / interpolate con ejemplos.

Y aquí la trampa que casi nadie cuenta: si rellenas hacia adelante y calculas retornos, creas velas de 0% que achican tu volatilidad. En el notebook lo medimos: la misma serie, dos volatilidades distintas según cómo trataste los huecos. (1:50)

[VISUAL 1:50] Dos curvas de volatilidad divergiendo: dropna vs ffill.

Luego el resample: pasar de horas a días. El precio se resume con velas —apertura, máximo, mínimo, cierre— y el volumen se suma. Suma, no promedio. Promediar volúmenes es un error silencioso que subestima la actividad real. (2:20)

[VISUAL 2:20] 24 velas horarias comprimiéndose en una vela diaria.

Los duplicados merecen su minuto: un timestamp repetido rompe resamples, joins y backtests. Elimínalos pronto y anota cuántos quitaste. Tu yo del futuro te lo agradece. (2:45)

[VISUAL 2:45] Fila duplicada resaltada y eliminada, contador en pantalla.

Y el pecado capital: `fillna(0)`. Un precio cero no es "sin dato", es una quiebra ficticia que genera una caída del 100%. El cero casi nunca es la respuesta. (3:05)

[VISUAL 3:05] Gráfico desplomándose a cero con sello de "FALSO".

Tu misión: compara dropna contra ffill en el notebook y explícame la diferencia con tus palabras. En la lección 3 dejamos los bucles atrás y pensamos en vectores. (3:25)

[VISUAL 3:25] Cierre: "Limpia primero, calcula después." + CTA al quiz.
