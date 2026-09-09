# Guion C5-L8 · Deployment: predict_demo.py (4 min)

> Tono: de taller, manos al teclado. Paso a paso, celebrando cada check verde.

**[VISUAL 0:00]** Terminal + título "Del notebook al sistema: predict_demo.py".

Tu modelo vive en un notebook. Hoy lo mudamos a un script que cualquier sistema puede llamar. Sesenta líneas, tres ideas.

**[VISUAL 0:30]** Esquema de la tubería: CSV → validación → features → modelo → JSON.

Idea uno: validar antes de predecir. El script exige las cinco columnas, mínimo 30 filas y cero nulos. Si algo falla, responde `ok: false` y sale con código 2. Sin señal y con alerta, nunca con una predicción inventada.

**[VISUAL 1:10]** Demo en vivo: CSV bueno → JSON verde; CSV roto → error rojo y exit 2.

Mira qué bonito es romperlo a propósito: le quitamos la columna volumen y el script se niega en redondo. Esa es la prueba más barata de todo el curso, y la que más dinero salva.

**[VISUAL 1:50]** Código de `featurizar()` resaltado, con flechas train y serve apuntando a la misma función.

Idea dos: un solo featurizador. El skew train-serve aparece cuando producción calcula los lags distinto que el entrenamiento. La defensa es estructural: una sola función, usada en ambos lados. Sin gemelos, sin divergencias.

**[VISUAL 2:40]** Comando corriendo y JSON de respuesta. Luego sello "PRODUCCIÓN": pickle versionado.

Idea tres: la demo reentrena por simplicidad, pero en producción sirves el artefacto congelado y versionado. El featurizador y la validación quedan intactos.

**[VISUAL 3:20]** Checklist en pantalla + quiz c5_l8.json.

Tu tarea: agregar la validación de precios no positivos y ver cómo un close en cero falla cerrado. ¡A desplegar!
