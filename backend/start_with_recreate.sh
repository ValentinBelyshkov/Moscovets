#!/bin/bash

# Пересоздаем базу данных
echo "Пересоздание базы данных..."
cd /Users/nikitasadovnikov/Downloads/moscovets/backend
python recreate_db.py

# Запускаем backend
echo "Запуск backend..."
python main.py