document.addEventListener('DOMContentLoaded', init);

const svg2D = d3.select("#gameCanvas2D");
const svg3D = d3.select("#gameCanvas3D");

let exitX;
let exitY;

let gen_maze = generateMaze(24, 33, animateStep);
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
    playerMoved: false,  // New flag
    visited: [],
    visitedCells: new Set()

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

     // Initialize visited with the initial position
     gameState.visited.push({ x: randomX, y: randomY });
  }

  function calculateDistances(maze, exitX, exitY) {
    let distances = Array.from(Array(maze.length), () => Array(maze[0].length).fill(Infinity));
    let queue = [[exitX, exitY, 0]];
    distances[exitY][exitX] = 0;
  
    while (queue.length > 0) {
      let [x, y, d] = queue.shift();
      for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        let newX = x + dx, newY = y + dy;
        if (newX >= 0 && newY >= 0 && newX < maze[0].length && newY < maze.length && maze[newY][newX] === 0 && distances[newY][newX] === Infinity) {
          distances[newY][newX] = d + 1;
          queue.push([newX, newY, d + 1]);
        }
      }
    }
    return distances;
  }

  

  function isCollision(x, y) {
    const cellX = Math.floor(x / gameConfig.cellSize);
    const cellY = Math.floor(y / gameConfig.cellSize);
  
    // Check array boundaries
    if (
      cellX >= 0 && cellX < gen_maze[0].length &&
      cellY >= 0 && cellY < gen_maze.length
    ) {
      return gen_maze[cellY][cellX] === 1;
    }
    return false;
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


      gameState.visited.forEach(({ x, y }) => {
        svg2D.append('rect')
          .attr('x', x * gameConfig.cellSize)
          .attr('y', y * gameConfig.cellSize)
          .attr('width', gameConfig.cellSize)
          .attr('height', gameConfig.cellSize)
          .attr('fill', 'brown');
      });

  }


  function movePlayer() {
    const { keys, player } = gameState;
    const { speed } = gameConfig;
    
    let moved = false;
    
    if (keys['KeyW'] && !isCollision(player.x + Math.cos(player.dir) * speed, player.y + Math.sin(player.dir) * speed)) {
      player.x += Math.cos(player.dir) * speed;
      player.y += Math.sin(player.dir) * speed;
      moved = true;
    }
    if (keys['KeyS'] && !isCollision(player.x - Math.cos(player.dir) * speed, player.y - Math.sin(player.dir) * speed)) {
      player.x -= Math.cos(player.dir) * speed;
      player.y -= Math.sin(player.dir) * speed;
      moved = true;
    }
    if (keys['KeyD'] && !isCollision(player.x - Math.sin(player.dir) * speed, player.y + Math.cos(player.dir) * speed)) {
      player.x -= Math.sin(player.dir) * speed;
      player.y += Math.cos(player.dir) * speed;
      moved = true;
    }
    if (keys['KeyA'] && !isCollision(player.x + Math.sin(player.dir) * speed, player.y - Math.cos(player.dir) * speed)) {
      player.x += Math.sin(player.dir) * speed;
      player.y -= Math.cos(player.dir) * speed;
      moved = true;
    }
    if (keys['ArrowLeft']) {
      player.dir -= 0.1;
      moved = true;
    }
    if (keys['ArrowRight']) {
      player.dir += 0.1;
      moved = true;
    }
    
    gameState.playerMoved = moved;

    if (moved) {
        const cellX = Math.floor(player.x / gameConfig.cellSize);
        const cellY = Math.floor(player.y / gameConfig.cellSize);
        if (!gameState.visited.some(v => v.x === cellX && v.y === cellY)) {
          gameState.visited.push({ x: cellX, y: cellY });
          gameState.visitedCells.add(`${cellX},${cellY}`);

        }
      }

  }
  

function renderRays() {
    const { player, svg2D } = gameState; // 2D SVG
    const { numRays, fov, speed } = gameConfig;
    const sliceWidth = window.innerWidth / numRays;
  
    for (let i = 0; i <= numRays; i++) {
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
                    .attr('stroke-width', 0.5);

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
  
    for (let i = 0; i <= numRays; i++) {
      let rayAngle = player.dir + (i - Math.floor(numRays / 2)) * (fov / numRays)+Math.PI / 16 ;
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
  
        //   const wallHeight = Math.min(screenHeight, screenHeight / (distance * Math.cos(rayAngle - player.dir)));
          const wallHeight = Math.min(screenHeight, (screenHeight * 4) / (distance * Math.cos(rayAngle - player.dir)));

          const wallTop = (screenHeight - wallHeight) / 6;
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
  
        //   svg3D.append('rect')
        //     .attr('x', i * sliceWidth)
        //     .attr('y', wallTop)
        //     .attr('width', sliceWidth)
        //     .attr('height', wallHeight)
        //     .attr('fill', wallColor)
        //     .attr('stroke', 'none');

        const distances = calculateDistances(gen_maze, exitX, exitY);

        // ...

        // const cellKey = `${cellX},${cellY}`;
        // const color = gameState.visitedCells.has(cellKey) ? d3.interpolateViridis(1 - (distanceToExit / maxDistance)) : wallColor;


            const cellX = Math.floor(x / gameConfig.cellSize);
            const cellY = Math.floor(y / gameConfig.cellSize);
            const cellKey = `${cellX},${cellY}`;
            const distanceToExit = distances[cellY][cellX];

            const color = gameState.visitedCells.has(cellKey) ? wallColor:d3.interpolateTurbo((distance / 1000));
            // const color = gameState.visitedCells.has(cellKey) ? wallColor:d3.interpolateTurbo((1 - (distanceToExit / maxDistance)));

            // visited
            // console.log(gameState.visitedCells.has(cellKey), cellKey);

            gameState.svg3D.append('rect')
            .attr('x', i * sliceWidth)
            .attr('y', wallTop)
            .attr('width', sliceWidth)
            .attr('height', wallHeight)
            .attr('fill', color);
        }
      }
    }
  }
  
  function gameLoop(){
    // if (gameState.playerMoved) {
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
    
      gameState.playerMoved = false;  // Reset the flag
    //   requestAnimationFrame(gameLoop);
    // } else {
      setTimeout(gameLoop, 50);  // Adjust delay as needed
    // }
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