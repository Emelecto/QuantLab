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

COPY . .

EXPOSE 8000

# Uvicorn detrás de gunicorn (workers=2, suficiente para el motor single-thread de backtest)
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:${PORT:-8000}", \
     "--workers", "2", \
     "--timeout", "120"]
