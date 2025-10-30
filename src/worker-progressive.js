// Worker для постепенной генерации множества Мандельброта
// Отправляет данные частями для прогрессивной отрисовки

/**
 * Вычисляет цвет для точки множества Мандельброта
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
 */
function getColor(iteration, maxIterations) {
  if (iteration === maxIterations) {
    return { r: 0, g: 0, b: 0 };
  }

  const ratio = iteration / maxIterations;
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
    b: Math.round((b + m) * 255),
  };
}

/**
 * Генерирует фрактал по частям (по строкам)
 */
function generateFractalProgressive(params) {
  const { width, height, iterations, zoom, centerX, centerY } = params;

  // Вычисляем диапазон координат
  const scale = 3.5 / zoom;
  const minX = centerX - scale / 2;
  const maxX = centerX + scale / 2;
  const minY = centerY - (scale * height) / width / 2;
  const maxY = centerY + (scale * height) / width / 2;

  // Размер чанка (количество строк для обработки за раз)
  const chunkSize = 20;

  // Обрабатываем по чанкам
  for (let startRow = 0; startRow < height; startRow += chunkSize) {
    const endRow = Math.min(startRow + chunkSize, height);
    const chunkHeight = endRow - startRow;

    // Создаём ImageData для текущего чанка
    const chunkData = new ImageData(width, chunkHeight);
    const data = chunkData.data;

    // Заполняем чанк
    for (let py = 0; py < chunkHeight; py++) {
      const actualY = startRow + py;

      for (let px = 0; px < width; px++) {
        // Преобразуем координаты пикселя в координаты комплексной плоскости
        const x0 = minX + (px / width) * (maxX - minX);
        const y0 = minY + (actualY / height) * (maxY - minY);

        // Вычисляем количество итераций
        const iteration = mandelbrot(x0, y0, iterations);

        // Получаем цвет
        const color = getColor(iteration, iterations);

        // Записываем цвет в ImageData
        const pixelIndex = (py * width + px) * 4;
        data[pixelIndex] = color.r;
        data[pixelIndex + 1] = color.g;
        data[pixelIndex + 2] = color.b;
        data[pixelIndex + 3] = 255;
      }
    }

    // Отправляем чанк обратно в основной поток
    self.postMessage(
      {
        type: "chunk",
        imageData: chunkData,
        startRow: startRow,
        progress: ((endRow / height) * 100).toFixed(0),
      },
      [chunkData.data.buffer]
    );
  }

  // Отправляем сообщение о завершении
  self.postMessage({
    type: "complete",
  });
}

// Обработчик сообщений от основного потока
self.onmessage = (e) => {
  const params = e.data;

  console.log("Progressive Worker: Начало генерации фрактала", params);

  // Генерируем фрактал прогрессивно
  generateFractalProgressive(params);

  console.log("Progressive Worker: Генерация завершена");
};
