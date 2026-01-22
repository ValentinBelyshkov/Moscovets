FROM python:3.9-slim

# Установка необходимых пакетов для assimp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libassimp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Установка Python зависимостей
COPY requirements.txt .
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

RUN apt-get update && \
    apt-get install -y --no-install-recommends libassimp-dev && \
    pip install --no-cache-dir -r requirements.txt

# Копирование остального кода
COPY . .

# Создаем директории для логов и фронтенда
RUN mkdir -p /app/logs /app/frontend/build

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]