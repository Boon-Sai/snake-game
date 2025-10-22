(function() {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const restartBtn = document.getElementById('restart');
  const overlay = document.getElementById('gameOver');
  const finalScoreEl = document.getElementById('finalScore');
  const playAgainBtn = document.getElementById('playAgain');

  // Board/grid config
  const tileSize = 20; // 20px tiles → 20x20 grid for 400x400 canvas
  const tilesX = canvas.width / tileSize;
  const tilesY = canvas.height / tileSize;

  // Colors
  const boardColor = '#0b1220';
  const gridColor = '#0f172a';
  const snakeHeadColor = '#22c55e';
  const snakeBodyColor = '#16a34a';
  const fruitColor = '#f97316';

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
    finalScoreEl.textContent = String(score);
    overlay.hidden = false;
    if (rafId) cancelAnimationFrame(rafId);
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
    drawTile(fruit.x, fruit.y, fruitColor);

    // Snake
    snake.forEach((seg, idx) => {
      drawTile(seg.x, seg.y, idx === 0 ? snakeHeadColor : snakeBodyColor);
    });
  }

  function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
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
  playAgainBtn.addEventListener('click', () => initGame());

  // Start
  initGame();
})();


