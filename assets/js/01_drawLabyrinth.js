// Define the drawing logic globally
function drawLabyrinthAsCells(canvasId, labyrinthData) {
    console.time('drawLabyrinthExecutionTime'); // Start the timer

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");

    const rows = labyrinthData.length;
    const cols = labyrinthData[0].length;

    // Calculate integer cell size and adjust canvas dimensions
    const cellSize = Math.ceil(canvas.width / cols);
    canvas.width = cellSize * cols;
    canvas.height = cellSize * rows;

    // Disable anti-aliasing (optional)
    ctx.imageSmoothingEnabled = false;

    ctx.beginPath();
    let batchSize = 10000; // Draw in chunks of 10,000 cells
    let count = 0;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labyrinthData[y][x] === 1) {
                ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                count++;
                if (count >= batchSize) {
                    ctx.fillStyle = "#daa520";
                    ctx.fill();
                    ctx.beginPath(); // Start a new batch
                    count = 0;
                }
            }
        }
    }
    // Final fill for remaining cells
    ctx.fillStyle = "#daa520";
    ctx.fill();


    count = 0;
    ctx.beginPath();
   
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labyrinthData[y][x] === 0) {
                ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                count++;
                if (count >= batchSize) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fill();
                    ctx.beginPath(); // Start a new batch
                    count = 0;
                }
            }
        }
    }
    // Final fill for remaining cells
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    console.timeEnd('drawLabyrinthExecutionTime'); // End the timer
}

function drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData, zoomLevel=1) {
    console.time('drawLabyrinthOffscreenExecutionTime'); // Start the timer
    console.log('Rendering maze: ', rows, 'x', cols, ' with cellSize = ', cellSize);
    // Disable anti-aliasing (optional)
    offscreenCtx.imageSmoothingEnabled = false;
    const canvasWidth = offscreenCtx.canvas.width;

    // Dynamic checkered mode for small scales
    const useCheckeredMode = cellSize <= 0.004 * canvasWidth;

    // Configuration constants
    const batchSize = 10000;
    const rectStyle = { fill: "#F6F6F8", stroke: "#F6F6F8", lineWidth: 1 };
    const lineStyle = { stroke: "#FFD700",
                        lineWidth: Math.max(Math.round((cellSize * 0.1)), 1), 
                        lineCap: "square", 
                        lineJoin: "square",
                        // shadow: "rgba(0, 0, 0, 0.5)",
                        // shadowBlur: 0,
                        // shadowOffsetX: 0,
                        // shadowOffsetY: 0,
    };

    let count = 0;

    // Predefine paths
    let rectPath = new Path2D();
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

    // Snap to integer pixel values
    const snap = (val) => Math.round(val);

    // Loop over only path cells (even rows and columns)
    // Loop over all cells
    
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

                if (labyrinthData[y][x] === 0 && isEvenRow && isEvenCol) {
                    // Path cell
                    const rect_x = (x - 1) / 2;
                    const rect_y = (y - 1) / 2;
                    rectPath.rect(snap(rect_x * cellSize), snap(rect_y * cellSize), cellSize, cellSize);

                } else if (labyrinthData[y][x] === 1) {
                    // Wall cells
                    if (isEvenRow && !isEvenCol) {
                        // Horizontal walls in even rows
                        const rect_x = (x - 1) / 2;
                        const rect_y = y / 2;
                        linePath.moveTo(snap(rect_x * cellSize), snap(rect_y * cellSize));
                        linePath.lineTo(snap((rect_x + 1) * cellSize), snap(rect_y * cellSize));
                    } else if (!isEvenRow && isEvenCol) {
                        // Vertical walls in odd rows
                        const rect_x = x / 2;
                        const rect_y = (y - 1) / 2;
                        linePath.moveTo(snap(rect_x * cellSize), snap(rect_y * cellSize));
                        linePath.lineTo(snap(rect_x * cellSize), snap((rect_y + 1) * cellSize));
                    }
                }

                // Handle batching
                if (++count >= batchSize) {
                    applyRectStyles();
                    offscreenCtx.fill(rectPath);
                    offscreenCtx.stroke(rectPath);

                    applyLineStyles();
                    offscreenCtx.stroke(linePath);

                    rectPath = new Path2D();
                    linePath = new Path2D();
                    count = 0;
                }
            }
        }
    }    

    // Render remaining batch
    applyRectStyles();
    offscreenCtx.fill(rectPath);
    offscreenCtx.stroke(rectPath);

    applyLineStyles();
    offscreenCtx.stroke(linePath);

    console.timeEnd('drawLabyrinthOffscreenExecutionTime'); // End the timer
}

// Export the function to make it accessible
window.drawLabyrinthOffscreen = drawLabyrinthOffscreen;