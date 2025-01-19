// Define the drawing logic globally
function drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData, zoomLevel=1, mazeStyle) {
    // console.time('drawLabyrinthOffscreenExecutionTime'); // Start the timer
    // console.log('Rendering maze: ', rows, 'x', cols, ' with cellSize = ', cellSize);
    // Disable anti-aliasing (optional)
    offscreenCtx.imageSmoothingEnabled = false;
    const canvasWidth = offscreenCtx.canvas.width;
    const canvasHeight = offscreenCtx.canvas.height;

    // Dynamic checkered mode for small scales
    // Use checkered mode if cell size is smaller than 0.5% of the smaller canvas dimension
    const useCheckeredMode = cellSize <= 0.005 * Math.min(canvasHeight, canvasWidth) || cellSize <= 4;
    // Configuration constants
    const batchSize = 500;
    const rectStyle = { fill: mazeStyle.pathFill, stroke: mazeStyle.pathFill, lineWidth: 1 };
    const lineStyle = { stroke: mazeStyle.wallStroke,
                        lineWidth: Math.max(Math.round((cellSize * 0.1)), 1), 
                        lineCap: "square", 
                        lineJoin: "square",
                        // shadow: "rgba(0, 0, 0, 0.5)",
                        // shadowBlur: 0,
                        // shadowOffsetX: 0,
                        // shadowOffsetY: 0,
    };

    let count = 0;

    // Path caching setup
    let linePathArray = []; 

    // Predefine paths
    let linePath = new Path2D();

    // Function to apply rectangle styles
    function applyRectStyles() {
        offscreenCtx.fillStyle = rectStyle.fill;
        offscreenCtx.strokeStyle = rectStyle.stroke;
        offscreenCtx.lineWidth = rectStyle.lineWidth;
    }

    // Function to apply line styles
    function applyLineStyles() {
        offscreenCtx.strokeStyle = lineStyle.stroke;
        offscreenCtx.lineWidth = lineStyle.lineWidth;
        offscreenCtx.lineCap = lineStyle.lineCap;
        offscreenCtx.lineJoin = lineStyle.lineJoin;
        // offscreenCtx.shadowColor = lineStyle.shadow;
        // offscreenCtx.shadowBlur = lineStyle.shadowBlur;
        // offscreenCtx.shadowOffsetX = lineStyle.shadowOffsetX;
        // offscreenCtx.shadowOffsetY = lineStyle.shadowOffsetY;
    }

    // Loop over all cells, render only walls
    
    if (useCheckeredMode) {
        const checkeredSize = Math.max(2, Math.floor(cellSize * zoomLevel)); // Scale dynamically with zoom
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = checkeredSize * 2;
        patternCanvas.height = checkeredSize * 2;

        // Draw checkered pattern
        patternCtx.fillStyle = rectStyle.fill; // Light color
        patternCtx.fillRect(0, 0, checkeredSize, checkeredSize);
        patternCtx.fillRect(checkeredSize, checkeredSize, checkeredSize, checkeredSize);

        patternCtx.fillStyle = lineStyle.stroke; // Darker color
        patternCtx.fillRect(0, checkeredSize, checkeredSize, checkeredSize);
        patternCtx.fillRect(checkeredSize, 0, checkeredSize, checkeredSize);

        // Use pattern as fill style
        const pattern = offscreenCtx.createPattern(patternCanvas, 'repeat');
        offscreenCtx.fillStyle = pattern;
        offscreenCtx.fillRect(0, 0, cellSize * (cols - 1) / 2, cellSize * (rows - 1) / 2);
    } else {
        for (let y = 0; y < rows; y++) {
            const isEvenRow = y % 2 === 0;
            for (let x = 0; x < cols; x++) {
                const isEvenCol = x % 2 === 0;
                if (labyrinthData[y][x] === 1) {
                    // Wall cells
                    if (isEvenRow && !isEvenCol) {
                        // Horizontal walls in even rows
                        const rect_x = (x - 1) / 2;
                        const rect_y = y / 2;
                        linePath.moveTo(rect_x * cellSize, rect_y * cellSize);
                        linePath.lineTo((rect_x + 1) * cellSize, rect_y * cellSize);
                    } else if (!isEvenRow && isEvenCol) {
                        // Vertical walls in odd rows
                        const rect_x = x / 2;
                        const rect_y = (y - 1) / 2;
                        linePath.moveTo(rect_x * cellSize, rect_y * cellSize);
                        linePath.lineTo(rect_x * cellSize, (rect_y + 1) * cellSize);
                    }
                }

                // Handle batching
                if (++count >= batchSize) {
                    linePathArray.push(linePath);
                    linePath = new Path2D();
                    count = 0;
                }
            }
        }
        linePathArray.push(linePath);
        
        // Render remaining batch
        applyRectStyles();
        offscreenCtx.fillRect(0, 0,
            (cols - 1) / 2 * cellSize, 
            (rows - 1) / 2 * cellSize
        );
        applyLineStyles();
        for (const path of linePathArray) {
            offscreenCtx.stroke(path);
        }
        // console.timeEnd('drawLabyrinthOffscreenExecutionTime'); // End the timer
    }    
}

// Export the function to make it accessible
window.drawLabyrinthOffscreen = drawLabyrinthOffscreen;