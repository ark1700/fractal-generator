# 🌀 Генератор фракталов

## 🚀 Запуск проекта

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm dev

# Откройте браузер по адресу http://localhost:5173
```

## 📁 Структура проекта

```
fractal-generator/
├── src/
│   ├── main.js              # Основной скрипт (UI и координация)
│   ├── worker.js            # Worker для полной генерации
│   ├── worker-progressive.js # Worker для прогрессивной генерации
│   └── style.css            # Стили приложения
├── index.html               # HTML разметка
├── package.json
└── README.md
```

## 🎮 Использование

1. **Уровень детализации**: Количество итераций (10-500). Чем больше, тем детальнее картинка
2. **Масштаб**: Увеличение/уменьшение фрактала (0.1-10)
3. **Центр X/Y**: Координаты центра просмотра
4. **Прогрессивная генерация**: Включает режим постепенной отрисовки

### Режимы работы

**Обычный режим** (без галочки):
- Worker генерирует весь фрактал целиком
- Результат отображается после завершения всех вычислений
- Использует `worker.js`

**Прогрессивный режим** (с галочкой):
- Worker генерирует фрактал по частям (по 20 строк)
- Фрактал "проявляется" постепенно
- Показывается процент выполнения
- Использует `worker-progressive.js`

## 🔧 Технические детали

### Web Workers

```javascript
// Создание Worker
worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

// Отправка данных в Worker
worker.postMessage(params);

// Получение результата
worker.onmessage = (e) => {
  const { imageData } = e.data;
  ctx.putImageData(imageData, 0, 0);
};
```

### Transferable Objects

Вместо копирования больших массивов данных, мы передаем владение буфером:

```javascript
// В worker.js
self.postMessage({ imageData }, [imageData.data.buffer]);
```

Это значительно быстрее для больших объемов данных!

### Прогрессивная отрисовка

Worker отправляет данные частями:

```javascript
// Отправка чанка
self.postMessage({
  type: 'chunk',
  imageData: chunkData,
  startRow: startRow,
  progress: ((endRow / height) * 100).toFixed(0)
}, [chunkData.data.buffer]);

// Отправка уведомления о завершении
self.postMessage({ type: 'complete' });
```

## 📊 Алгоритм Мандельброта

Для каждого пикселя вычисляется, принадлежит ли точка комплексной плоскости множеству Мандельброта:

```
z₀ = 0
zₙ₊₁ = zₙ² + c

где c - координата точки на комплексной плоскости
```

Если последовательность не расходится за N итераций, точка принадлежит множеству (черный цвет).
Иначе цвет определяется по количеству итераций до "побега".

## 🎨 Цветовая палитра

Используется HSV → RGB преобразование для создания красивого градиента:

- Черный цвет: точка принадлежит множеству
- Цветной градиент: интенсивность зависит от скорости "побега"

## 📚 Полезные ссылки

- [MDN: Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN: Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [Mandelbrot Set на Wikipedia](https://en.wikipedia.org/wiki/Mandelbrot_set)

---
