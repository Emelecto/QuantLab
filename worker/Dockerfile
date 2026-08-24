# QuantLab worker — imagen para Railway / Render / cualquier registry OCI
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Dependencias del sistema para pandas/numpy/compilación de wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn
# Asegurar PyJWT (no el paquete 'jwt' viejo que colisiona con el import)
RUN pip uninstall -y jwt && pip install --force-reinstall --no-cache-dir "PyJWT[cors]==2.9.0"

COPY . .

EXPOSE 8000

# Uvicorn detrás de gunicorn (workers=2, suficiente para el motor single-thread de backtest).
# Usamos shell form (sh -c) para que $PORT se expanda con la variable de entorno
# que inyecta Render/Vercel (sin llaves para evitar el error '${PORT' no válido).
CMD sh -c "gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
