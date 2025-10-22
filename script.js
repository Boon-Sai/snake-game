(function() {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const restartBtn = document.getElementById('restart');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start');

  // Board/grid config
  const tileSize = 20; // 20px tiles → 20x20 grid for 400x400 canvas
  const tilesX = canvas.width / tileSize;
  const tilesY = canvas.height / tileSize;

  // Graphics
  const boardColor = '#0b1220';
  const gridColor = '#0f172a';
  const snakeHeadSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="color: #22c55e">
    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A1.23 1.23 0 0 0 4.5 16h11a1.23 1.23 0 0 0 .625-.202 1.23 1.23 0 0 0 .41-1.412A9.982 9.982 0 0 0 10 12a9.982 9.982 0 0 0-6.535 2.493Z" />
  </svg>`;
  const snakeBodySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="color: #16a34a">
    <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
  </svg>`;
  const fruitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="color: #f97316">
    <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" />
  </svg>`;
  const imgCache = new Map();
  ['snakeHead', 'snakeBody', 'fruit'].forEach(id => {
    const svg = (id === 'snakeHead') ? snakeHeadSvg : (id === 'snakeBody' ? snakeBodySvg : fruitSvg);
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    imgCache.set(id, img);
  });

  // Game state
  let snake; // array of {x, y}
  let direction; // {x, y}
  let nextDirection; // queued direction to avoid reversing twice in one tick
  let fruit;
  let score;
  let isRunning = false;
  let tickMs = 120; // speed
  let rafId = null;
  let lastTickAt = 0;

  function initGame() {
    snake = [
      { x: Math.floor(tilesX / 2), y: Math.floor(tilesY / 2) },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    fruit = spawnFruit(snake);
    score = 0;
    scoreEl.textContent = String(score);
    isRunning = true;
    overlay.hidden = true;
    lastTickAt = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(gameLoop);
  }

  function showStartScreen() {
    if (rafId) cancelAnimationFrame(rafId);
    overlay.hidden = false;
    ctx.fillStyle = boardColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function spawnFruit(occupied) {
    while (true) {
      const x = Math.floor(Math.random() * tilesX);
      const y = Math.floor(Math.random() * tilesY);
      const collides = occupied.some(seg => seg.x === x && seg.y === y);
      if (!collides) return { x, y };
    }
  }

  function gameLoop(ts) {
    rafId = requestAnimationFrame(gameLoop);
    if (!lastTickAt) lastTickAt = ts;
    const dt = ts - lastTickAt;
    if (dt < tickMs) {
      render();
      return;
    }
    lastTickAt = ts;

    // update
    direction = validateTurn(direction, nextDirection);
    const newHead = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Borders → game over
    if (newHead.x < 0 || newHead.x >= tilesX || newHead.y < 0 || newHead.y >= tilesY) {
      return endGame();
    }

    // Self-collision → game over
    if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      return endGame();
    }

    snake.unshift(newHead);

    // Fruit
    if (newHead.x === fruit.x && newHead.y === fruit.y) {
      score += 1;
      scoreEl.textContent = String(score);
      fruit = spawnFruit(snake);
    } else {
      snake.pop(); // move without growing
    }

    render();
  }

  function endGame() {
    isRunning = false;
    showStartScreen();
  }

  function validateTurn(current, next) {
    // Prevent 180° turns
    if (current.x + next.x === 0 && current.y + next.y === 0) return current;
    return next;
  }

  function render() {
    // Clear board
    ctx.fillStyle = boardColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = tileSize; x < canvas.width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = tileSize; y < canvas.height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    // Fruit
    drawImg(imgCache.get('fruit'), fruit.x, fruit.y);

    // Snake
    snake.forEach((seg, idx) => {
      drawImg(imgCache.get(idx === 0 ? 'snakeHead' : 'snakeBody'), seg.x, seg.y);
    });
  }

  function drawImg(img, x, y) {
    ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
  }

  // Input
  window.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        nextDirection = { x: 0, y: -1 }; break;
      case 'ArrowDown':
      case 's':
      case 'S':
        nextDirection = { x: 0, y: 1 }; break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        nextDirection = { x: -1, y: 0 }; break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        nextDirection = { x: 1, y: 0 }; break;
      default:
        return;
    }
    e.preventDefault();
  }, { passive: false });

  restartBtn.addEventListener('click', () => initGame());
  startBtn.addEventListener('click', () => initGame());

  // Start
  showStartScreen();
})();


