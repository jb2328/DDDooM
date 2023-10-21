document.addEventListener('DOMContentLoaded', init);

const svg2D = d3.select("#gameCanvas2D");
const svg3D = d3.select("#gameCanvas3D");

let gen_maze = generateMaze(20, 30, animateStep);
// let maze = generateMaze(14, 18);

const gameConfig = {
    cellSize: 15,
    speed: 1,
    numRays: 180,
    fov: Math.PI / 2,
    gameMap : gen_maze
  };

  const gameState = {
    keys: {},
    player: { x: 30, y: 30, dir: Math.PI / 4 },
    svg: null,
  };
  
  function init() {
    // const svg2D = d3.select("#gameCanvas2D");
    // const svg3D = d3.select("#gameCanvas3D");
    gameState.svg2D = svg2D;
    gameState.svg3D = svg3D;
    
    setupEventListeners();
    initializePlayerPosition();
    drawMap();
    gameLoop();
  }
  
//   document.addEventListener('DOMContentLoaded', init);

function setupEventListeners() {
  document.addEventListener('keydown', event => { gameState.keys[event.code] = true; });
  document.addEventListener('keyup', event => { gameState.keys[event.code] = false; });
}


function initializePlayerPosition() {
    const { gameMap, cellSize } = gameConfig;
    const { player } = gameState;
    const mapHeight = gameMap.length;
    const mapWidth = gameMap[0].length;
  
    // Find a random position with a value of 0
    let randomX, randomY;
    do {
      randomX = Math.floor(Math.random() * mapWidth);
      randomY = Math.floor(Math.random() * mapHeight);
    } while (gameMap[randomY][randomX] !== 0);
  
    // Set player's initial position
    player.x = randomX * cellSize + cellSize / 2;
    player.y = randomY * cellSize + cellSize / 2;
  }



function isCollision(x, y) {
    const cellX = Math.floor(x / gameConfig.cellSize);
    const cellY = Math.floor(y / gameConfig.cellSize);
    return gameConfig.gameMap[cellY][cellX] === 1;
  }
  
  function drawMap() {
    const { cellSize } = gameConfig;
    const { svg2D, player } = gameState;
    svg2D.selectAll('*').remove(); // Clear existing elements
  
    // Draw grid
    gameConfig.gameMap.forEach((row, y) => {
      row.forEach((cell, x) => {
        svg2D.append('rect')
          .attr('x', x * cellSize)
          .attr('y', y * cellSize)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', cell ? 'white' : 'black');
      });
    });
  
    // Draw player
    svg2D.append('circle')
      .attr('cx', player.x)
      .attr('cy', player.y)
      .attr('r', 5)
      .attr('fill', 'blue');
  }
  
function movePlayer() {
  const { keys, player } = gameState;
  const { speed } = gameConfig;
  if (keys['ArrowUp'] && !isCollision(player.x + Math.cos(player.dir) * speed, player.y + Math.sin(player.dir) * speed)) {
    player.x += Math.cos(player.dir) * speed;
    player.y += Math.sin(player.dir) * speed;
  }
  if (keys['ArrowDown'] && !isCollision(player.x - Math.cos(player.dir) * speed, player.y - Math.sin(player.dir) * speed)) {
    player.x -= Math.cos(player.dir) * speed;
    player.y -= Math.sin(player.dir) * speed;
  }
  if (keys['ArrowLeft']) player.dir -= 0.1;
  if (keys['ArrowRight']) player.dir += 0.1;
}

function renderRays() {
    const { player, svg2D } = gameState; // 2D SVG
    const { numRays, fov, speed } = gameConfig;
    const sliceWidth = window.innerWidth / numRays;
  
    for (let i = 0; i < numRays; i++) {
        let rayAngle = player.dir + (i - Math.floor(numRays / 2)) * (fov / numRays);
        let dx = Math.cos(rayAngle) * speed;
        let dy = Math.sin(rayAngle) * speed;
        let x = player.x;
        let y = player.y;
        let distance = 0;

        let hitWall = false;
        while (!hitWall) {
            x += dx;
            y += dy;
            distance += Math.sqrt(dx * dx + dy * dy);

            if (isCollision(x, y)) {
                hitWall = true;

                // Draw 2D rays on the left SVG
                svg2D.append('line')
                    .attr('x1', player.x)
                    .attr('y1', player.y)
                    .attr('x2', x)
                    .attr('y2', y)
                    .attr('stroke', 'yellow')
                    .attr('stroke-width', 1);

                // 3D Rendering
                const screenHeight = window.innerHeight;
                const wallHeight = Math.min(screenHeight, screenHeight / (distance * Math.cos(rayAngle - player.dir)));
                const wallTop = (screenHeight - wallHeight) / 2;
                gameState.svg3D.append('rect')
                    .attr('x', i * sliceWidth)
                    .attr('y', wallTop)
                    .attr('width', sliceWidth)
                    .attr('height', wallHeight)
                    .attr('fill', 'red');
            }
        }
    }
}

function renderFaux3D() {
    const { player } = gameState;
    const { numRays, fov, speed } = gameConfig;
    const svg3D = gameState.svg3D;
    const screenHeight = window.innerHeight;
    const sliceWidth = window.innerWidth / numRays;
  
    for (let i = 0; i < numRays; i++) {
      let rayAngle = player.dir + (i - Math.floor(numRays / 2)) * (fov / numRays);
      let dx = Math.cos(rayAngle) * speed;
      let dy = Math.sin(rayAngle) * speed;
      let x = player.x;
      let y = player.y;
      let distance = 0;
  
      let hitWall = false;
      while (!hitWall) {
        x += dx;
        y += dy;
        distance += Math.sqrt(dx * dx + dy * dy);
  
        if (isCollision(x, y)) {
          hitWall = true;
  
          const wallHeight = Math.min(screenHeight, screenHeight / (distance * Math.cos(rayAngle - player.dir)));
          const wallTop = (screenHeight - wallHeight) / 4;
          const wallBottom = wallTop + wallHeight;
  
          // Ceiling
          svg3D.append('rect')
            .attr('x', i * sliceWidth)
            .attr('y', 0)
            .attr('width', sliceWidth)
            .attr('height', wallTop)
            .attr('fill', 'gray');
  
          // Floor
          svg3D.append('rect')
            .attr('x', i * sliceWidth)
            .attr('y', wallBottom)
            .attr('width', sliceWidth)
            .attr('height', screenHeight - wallBottom)
            .attr('fill', 'darkgray');
  
          // Wall
          const brightness = 1 - (distance / 100); // Adjust the divisor for desired effect
          const wallColor = `rgb(${Math.floor(255 * brightness)}, ${Math.floor(255 * brightness)}, ${Math.floor(255 * brightness)})`;
  
          svg3D.append('rect')
            .attr('x', i * sliceWidth)
            .attr('y', wallTop)
            .attr('width', sliceWidth)
            .attr('height', wallHeight)
            .attr('fill', wallColor)
            .attr('stroke', 'none');
        }
      }
    }
  }
  
  function gameLoop(){
    // Clear previous frame
    d3.selectAll('.ray').remove();
    d3.selectAll('.wallSlice').remove();
  
    // Update player
    movePlayer();
  
    // Render 2D rays on the left SVG
    gameState.svg2D.selectAll('*').remove();
    drawMap();
    renderRays();
  
    // Render faux-3D on the right SVG
    gameState.svg3D.selectAll('*').remove();
    renderFaux3D();
  
    requestAnimationFrame(gameLoop);
  }
  


    // [
    //     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,1,1, 1, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 1, 1, 0, 0, 0, 1, 1, 0,0,0, 0, 1],
    //     [1, 0, 1, 1, 0, 0, 0, 1, 1, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,1,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 0, 1, 1, 0, 0, 0, 1, 1, 0,0,0, 0, 1],
    //     [1, 0, 1, 1, 0, 0, 0, 1, 1, 0,0,0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0, 0, 1],
    //     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,1,1, 1, 1]
    //   ]