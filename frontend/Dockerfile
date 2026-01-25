# Используем node для запуска dev-сервера
FROM node:18-alpine

# Устанавливаем необходимые системные зависимости для сборки canvas и других нативных модулей
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости с увеличенным таймаутом и дополнительной информацией
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --legacy-peer-deps --verbose

# Копируем исходный код
COPY . .

# Устанавливаем права доступа
RUN chown -R node:node /app
USER node

# Открываем порт 3000 для dev-сервера
EXPOSE 3000

# Запускаем dev-сервер
CMD ["npm", "start"]