#!/bin/bash

# Аудиогид - Скрипт установки
# Автоматическая установка и настройка приложения

set -e

echo "🎵 Установка Аудиогид Web Application"
echo "======================================"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Установите Node.js 18+ с https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18 или выше!"
    echo "Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен!"
    exit 1
fi

echo "✅ npm $(npm -v)"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

echo ""
echo "✅ Зависимости установлены"
echo ""

# Настройка .env
if [ ! -f .env ]; then
    echo "⚙️  Настройка переменных окружения..."
    
    read -p "Введите URL backend API (по умолчанию: http://51.250.86.178:30102/api): " API_URL
    API_URL=${API_URL:-http://51.250.86.178:30102/api}
    
    echo ""
    echo "2GIS API ключ:"
    echo "По умолчанию используется расширенный ключ с увеличенными лимитами."
    echo "Нажмите Enter для использования ключа по умолчанию или введите свой:"
    read -p "2GIS API ключ: " USER_KEY
    
    # Используем расширенный ключ по умолчанию
    API_KEY=${USER_KEY:-89ebb4c5-891d-4609-9e53-66383a3cbdbc}
    
    cat > .env << EOF
# Backend API
VITE_API_BASE_URL=$API_URL

# 2GIS API Key (один ключ для всех API)
VITE_2GIS_MAP_API_KEY=$API_KEY
VITE_2GIS_DIRECTIONS_API_KEY=$API_KEY
EOF
    
    echo "✅ Файл .env создан"
    echo "   API ключ: $API_KEY"
else
    echo "⚠️  Файл .env уже существует, пропускаем..."
fi

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "Для запуска приложения выполните:"
echo "  npm run dev"
echo ""
echo "Приложение будет доступно по адресу:"
echo "  http://localhost:3000"
echo ""
echo "Для сборки production версии:"
echo "  npm run build"
echo ""
echo "Документация:"
echo "  README.md - Полная документация"
echo "  QUICKSTART.md - Быстрый старт"
echo "  EXAMPLES.md - Примеры использования"
echo "  DEPLOYMENT.md - Развертывание"
echo ""
