// Worker для генерации множества Мандельброта
// Этот код выполняется в отдельном потоке

/**
 * Вычисляет цвет для точки множества Мандельброта
 * @param {number} x0 - координата x
 * @param {number} y0 - координата y
 * @param {number} maxIterations - максимальное количество итераций
 * @returns {number} - количество итераций до "побега"
 */
function mandelbrot(x0, y0, maxIterations) {
  let x = 0;
  let y = 0;
  let iteration = 0;

  while (x * x + y * y <= 4 && iteration < maxIterations) {
    const xTemp = x * x - y * y + x0;
    y = 2 * x * y + y0;
    x = xTemp;
    iteration++;
  }

  return iteration;
}

/**
 * Преобразует количество итераций в цвет RGB
 * @param {number} iteration - количество итераций
 * @param {number} maxIterations - максимальное количество итераций
 * @returns {Object} - объект с компонентами r, g, b
 */
function getColor(iteration, maxIterations) {
  if (iteration === maxIterations) {
    // Точка принадлежит множеству - черный цвет
    return { r: 0, g: 0, b: 0 };
  }

  // Создаем красивый градиент для точек вне множества
  const ratio = iteration / maxIterations;

  // Используем HSV->RGB преобразование для плавного цветового перехода
  const hue = ratio * 360;
  const saturation = 1.0;
  const value = ratio < 0.5 ? 2 * ratio : 1.0;

  return hsvToRgb(hue, saturation, value);
}

/**
 * Конвертирует HSV в RGB
 */
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r, g, b;

  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Генерирует фрактал целиком
 * @param {Object} params - параметры генерации
 */
function generateFractal(params) {
  const { width, height, iterations, zoom, centerX, centerY } = params;

  // Создаём ImageData для хранения пикселей
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  // Вычисляем диапазон координат с учетом масштаба
  const scale = 3.5 / zoom;
  const minX = centerX - scale / 2;
  const maxX = centerX + scale / 2;
  const minY = centerY - scale * height / width / 2;
  const maxY = centerY + scale * height / width / 2;

  // Проходим по каждому пикселю
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      // Преобразуем координаты пикселя в координаты комплексной плоскости
      const x0 = minX + (px / width) * (maxX - minX);
      const y0 = minY + (py / height) * (maxY - minY);

      // Вычисляем количество итераций для данной точки
      const iteration = mandelbrot(x0, y0, iterations);

      // Получаем цвет
      const color = getColor(iteration, iterations);

      // Записываем цвет в ImageData
      const pixelIndex = (py * width + px) * 4;
      data[pixelIndex] = color.r;       // Red
      data[pixelIndex + 1] = color.g;   // Green
      data[pixelIndex + 2] = color.b;   // Blue
      data[pixelIndex + 3] = 255;       // Alpha (непрозрачность)
    }
  }

  return imageData;
}

// Обработчик сообщений от основного потока
self.onmessage = (e) => {
  const params = e.data;

  console.log('Worker: Начало генерации фрактала', params);

  // Генерируем фрактал
  const imageData = generateFractal(params);

  console.log('Worker: Генерация завершена');

  // Отправляем результат обратно в основной поток
  // Используем Transferable Objects для оптимизации передачи больших данных
  // Это передает владение буфером, а не копирует его
  self.postMessage({ imageData }, [imageData.data.buffer]);
};
