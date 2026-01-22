# Используем nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем директорию и устанавливаем правильные permissions
RUN mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Копируем уже собранные статические файлы
COPY ./build /usr/share/nginx/html/

# Устанавливаем правильного владельца для скопированных файлов
RUN chown -R nginx:nginx /usr/share/nginx/html

# Проверяем что index.html существует
RUN test -f /usr/share/nginx/html/index.html || echo "Warning: index.html not found"

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]