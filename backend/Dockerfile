FROM python:3.9-slim as production

# Установка необходимых пакетов для assimp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libassimp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка переменных окружения
ENV PYTHONPATH=/app:$PYTHONPATH
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# Копируем и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код
COPY . .

# Создаем директории для логов
RUN mkdir -p /app/logs

EXPOSE 5001

# Production команды
CMD ["sh", "-c", "export PYTHONPATH=$(pwd):$PYTHONPATH && uvicorn main:app --host 0.0.0.0 --port 5001"]


# Development stage
FROM python:3.9-slim as development

# Установка необходимых пакетов для assimp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libassimp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка переменных окружения
ENV PYTHONPATH=/app:$PYTHONPATH
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# Копируем и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код (будет монтироваться в dev-режиме)
COPY . .

# Создаем директории для логов
RUN mkdir -p /app/logs

EXPOSE 5001

# Команда по умолчанию будет переопределена в docker-compose для dev-режима
CMD ["sh", "-c", "export PYTHONPATH=$(pwd):$PYTHONPATH && uvicorn main:app --host 0.0.0.0 --port 5001 --reload"]