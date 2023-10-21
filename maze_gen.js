function generateMaze(width = 20, height = 30, onStep) {
    let maze = Array.from(Array(height), () => Array(width).fill(1));
  
    function isValid(x, y, visited) {
      return x >= 0 && y >= 0 && x < width && y < height && !visited[y][x];
    }
  
    function carveOpenSpace(x, y, size) {
      for (let i = x; i < x + size; i++) {
        for (let j = y; j < y + size; j++) {
          if (i < width && j < height) {
            maze[j][i] = 0;
            if (onStep) onStep(i, j, 0);
          }
        }
      }
    }
  
    function DFS(x, y, visited) {
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      d3.shuffle(directions);
  
      visited[y][x] = true;
      maze[y][x] = 0;
      if (onStep) onStep(x, y, 0);
  
      // Occasionally carve out an open space
      if (Math.random() < 0.2) {
        carveOpenSpace(x, y, 3); // size 3x3, adjust as needed
      }
  
      for (let [dx, dy] of directions) {
        let newX = x + 2 * dx, newY = y + 2 * dy;
  
        if (isValid(newX, newY, visited)) {
          maze[y + dy][x + dx] = 0;
          if (onStep) onStep(x + dx, y + dy, 0);
          DFS(newX, newY, visited);
        }
      }
    }
  
    let visited = Array.from(Array(height), () => Array(width).fill(false));
    DFS(0, 0, visited);
  
    // Random exit on right edge
    const randomY = Math.floor(Math.random() * height);
    maze[randomY][width - 1] = 0;
    exitX = width - 1;
    exitY = randomY;
  
    if (onStep) onStep(width - 1, randomY, 0);
  
    return maze;
  }
  
  
  // Optional animation function
  function animateStep(x, y, value) {
    const cellSize = 20;
    d3.select("#gameCanvas2D")
      .append("rect")
      .attr("x", x * cellSize)
      .attr("y", y * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", value === 1 ? "black" : "white")
      .transition()
      .duration(50);
  }
  
