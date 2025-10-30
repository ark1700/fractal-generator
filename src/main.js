// Импортируем Worker'ы явно для правильной сборки
import WorkerUrl from "./worker.js?worker&url";
import WorkerProgressiveUrl from "./worker-progressive.js?worker&url";

// Получаем элементы DOM
const canvas = document.getElementById("fractal-canvas");
const ctx = canvas.getContext("2d");
const generateBtn = document.getElementById("generate-btn");
const loadingIndicator = document.getElementById("loading");
const statusMessage = document.getElementById("status");

// Элементы управления
const iterationsInput = document.getElementById("iterations");
const iterationsValue = document.getElementById("iterations-value");
const zoomInput = document.getElementById("zoom");
const zoomValue = document.getElementById("zoom-value");
const centerXInput = document.getElementById("centerX");
const centerXValue = document.getElementById("centerX-value");
const centerYInput = document.getElementById("centerY");
const centerYValue = document.getElementById("centerY-value");
const progressiveModeCheckbox = document.getElementById("progressive-mode");

// Глобальная переменная для Worker
let worker = null;
let debounceTimer = null;

// Обновление отображаемых значений при изменении ползунков
iterationsInput.addEventListener("input", (e) => {
  iterationsValue.textContent = e.target.value;
  debouncedGenerate();
});

zoomInput.addEventListener("input", (e) => {
  zoomValue.textContent = parseFloat(e.target.value).toFixed(1);
  debouncedGenerate();
});

centerXInput.addEventListener("input", (e) => {
  centerXValue.textContent = parseFloat(e.target.value).toFixed(2);
  debouncedGenerate();
});

centerYInput.addEventListener("input", (e) => {
  centerYValue.textContent = parseFloat(e.target.value).toFixed(2);
  debouncedGenerate();
});

// Функция для показа индикатора загрузки
function showLoading() {
  loadingIndicator.style.display = "flex";
  generateBtn.disabled = true;
  statusMessage.textContent = "⏳ Генерация фрактала...";
  statusMessage.style.color = "#007bff";
}

// Функция для скрытия индикатора загрузки
function hideLoading() {
  loadingIndicator.style.display = "none";
  generateBtn.disabled = false;
}

// Debounced генерация - отменяет предыдущую задачу и запускает новую через задержку
function debouncedGenerate() {
  // Очищаем предыдущий таймер
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Устанавливаем новый таймер
  debounceTimer = setTimeout(() => {
    generateFractal();
  }, 300); // 300ms задержка
}

// Функция для генерации фрактала
function generateFractal() {
  // Очищаем canvas белым цветом перед генерацией
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Показываем индикатор загрузки
  showLoading();

  // Если Worker уже существует, завершаем его
  if (worker) {
    worker.terminate();
  }

  // Выбираем тип Worker в зависимости от режима
  const useProgressive = progressiveModeCheckbox.checked;
  const workerUrl = useProgressive ? WorkerProgressiveUrl : WorkerUrl;

  // Создаём новый Worker
  worker = new Worker(workerUrl, { type: "module" });

  // Собираем параметры для генерации
  const params = {
    width: canvas.width,
    height: canvas.height,
    iterations: parseInt(iterationsInput.value),
    zoom: parseFloat(zoomInput.value),
    centerX: parseFloat(centerXInput.value),
    centerY: parseFloat(centerYInput.value),
  };

  // Засекаем время начала
  const startTime = performance.now();

  // Отправляем данные в Worker
  worker.postMessage(params);

  // Обрабатываем сообщения от Worker
  if (useProgressive) {
    // Прогрессивный режим - получаем частичные обновления
    worker.onmessage = (e) => {
      const { type, imageData, startRow, progress } = e.data;
      hideLoading();

      if (type === "chunk") {
        // Отрисовываем чанк на canvas
        ctx.putImageData(imageData, 0, startRow);

        // Обновляем статус с прогрессом
        statusMessage.textContent = `⏳ Генерация: ${progress}%`;
        statusMessage.style.color = "#007bff";
      } else if (type === "complete") {
        const endTime = performance.now();
        const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);

        // Скрываем индикатор загрузки
        hideLoading();

        // Показываем сообщение об успехе
        statusMessage.textContent = `✅ Фрактал сгенерирован за ${timeElapsed} сек (прогрессивно)`;
        statusMessage.style.color = "#28a745";
      }
    };
  } else {
    // Обычный режим - получаем полное изображение
    worker.onmessage = (e) => {
      const { imageData } = e.data;
      const endTime = performance.now();
      const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);

      // Отрисовываем результат на canvas
      ctx.putImageData(imageData, 0, 0);

      // Скрываем индикатор загрузки
      hideLoading();

      // Показываем сообщение об успехе
      statusMessage.textContent = `✅ Фрактал сгенерирован за ${timeElapsed} сек`;
      statusMessage.style.color = "#28a745";
    };
  }

  // Обрабатываем ошибки
  worker.onerror = (error) => {
    console.error("Worker error:", error);
    hideLoading();
    statusMessage.textContent = `❌ Ошибка: ${error.message}`;
    statusMessage.style.color = "#dc3545";
  };
}

// Обработчик нажатия на кнопку
generateBtn.addEventListener("click", generateFractal);

// Генерируем фрактал при загрузке страницы
window.addEventListener("load", () => {
  statusMessage.textContent =
    '👋 Нажмите "Сгенерировать фрактал" или измените параметры';
  statusMessage.style.color = "#6c757d";

  // Автоматически генерируем первый фрактал
  setTimeout(generateFractal, 500);
});
