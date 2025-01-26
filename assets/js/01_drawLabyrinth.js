// Define the drawing logic globally
function drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData, zoomLevel=1, mazeStyle, useMultiColorFloor=false) {

    // Processes walls in 2 separate loops (horizontal and vertical) and extends lines where the wall is longer than one cell
    // Wins original, 1.5 - 2x boost


    // console.time('drawLabyrinthOffscreenExecutionTime'); // Start the timer
    // console.log('Rendering maze: ', rows, 'x', cols, ' with cellSize = ', cellSize);
    // Disable anti-aliasing (optional)
    offscreenCtx.imageSmoothingEnabled = false;
    const canvasWidth = offscreenCtx.canvas.width;
    const canvasHeight = offscreenCtx.canvas.height;

    // Dynamic checkered mode for small scales
    // Use checkered mode if cell size is smaller than 0.5% of the smaller canvas dimension
    const useCheckeredMode = cellSize <= 4;
    // Configuration constants
    // const batchSize = 500;
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
        // Draw horizontal walls
        for (let y = 0; y < rows; y+=2) {
            let x = 1;
            while (x < cols) {
                if (labyrinthData[y][x] === 0) {
                    x+=2;
                } else if (labyrinthData[y][x] === 1) {
                    linePath.moveTo( cellSize * (x-1) / 2, cellSize * y / 2);
                    let drawLine = false;                    
                    while (x < cols && !drawLine) {
                        if (labyrinthData[y][x] === 1) {
                            if (x + 2 === cols) {
                                linePath.lineTo(cellSize * ((x + 1) / 2), cellSize * y / 2);
                                drawLine = true;
                            }
                            x+=2;
                        } else if (labyrinthData[y][x] === 0) {
                            linePath.lineTo(cellSize * ((x - 1) / 2), cellSize * y / 2)
                            x+=2;
                            drawLine = true;
                        }
                    }
                }
            }
        }
        //Draw vertical walls
        for (let x = 0; x < cols; x+=2) {
            let y = 1;
            while (y < rows) {
                if (labyrinthData[y][x] === 0) {
                    y+=2;
                } else if (labyrinthData[y][x] === 1) {
                    linePath.moveTo( cellSize * x / 2, cellSize * (y - 1) / 2);
                    let drawLine = false;
                    while (y < rows && !drawLine) {
                        if (labyrinthData[y][x] === 1) {
                            if (y + 2 === rows) {
                                linePath.lineTo(cellSize * (x / 2), cellSize * ((y + 1) / 2));
                                drawLine = true;
                            }
                            y+=2;
                        } else if (labyrinthData[y][x] === 0) {
                            linePath.lineTo(cellSize * (x / 2), cellSize * ((y - 1) / 2));
                            y+=2;
                            drawLine = true;
                        }
                    }
                }  
            }
        }
     
        linePathArray.push(linePath);

        // Pre-calculate the width and height of the floor
        const numCellsCols = (cols - 1) / 2;
        const numCellsRows = (rows - 1) / 2;
        const floorWidth = numCellsCols * cellSize;
        const floorHeight = numCellsRows * cellSize;

        // Prepare floor image as imageData - perform only during maze generation animation
        if (useMultiColorFloor) {
            const mazeFloorColors = [ // implementation for DFS maze generation.
                hexToRgba(mazeStyle.pathFill), // index 0, value 0 in the data, clear visited backtracked cell
                hexToRgba(mazeStyle.wallStroke), // index 1, value 1, unvisited cell / wall
                //hexToRgba(mazeStyle.wallStroke, 50), // index 2, value 2, visited but not backtracked cell
                [255, 255, 255, 255],
            ]

            let floorImageDataArray = new Uint8ClampedArray(numCellsCols * numCellsRows * 4);
            
            for (let y = 1; y < rows; y += 2) {
                for (let x = 1; x < cols; x += 2) {
                    const cellValue = labyrinthData[y][x];
                    const cellColor = mazeFloorColors[cellValue];
                    const cellRow = (y - 1) / 2;
                    const cellCol = (x - 1) / 2;
                    const cellDataStart = (cellRow * numCellsCols + cellCol) * 4;
                    // Directly assign to the array
                    floorImageDataArray[cellDataStart] = cellColor[0]; // R
                    floorImageDataArray[cellDataStart + 1] = cellColor[1]; // G
                    floorImageDataArray[cellDataStart + 2] = cellColor[2]; // B
                    floorImageDataArray[cellDataStart + 3] = cellColor[3]; // A
                }
            }
            
            const floorImageData = new ImageData(floorImageDataArray, numCellsCols);
            // Create buffer canvas to allow scaling on image data
            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = numCellsCols;
            bgCanvas.height = numCellsRows;
            const bgCtx = bgCanvas.getContext('2d');
            bgCtx.putImageData(floorImageData, 0, 0);

            // Draw the scaled image to the offscreen canvas
            offscreenCtx.save(); // Save state for transformations
            offscreenCtx.scale(cellSize, cellSize);
            offscreenCtx.drawImage(bgCanvas, 0, 0); // Draw the image once at the scaled size
            offscreenCtx.restore();
        } else {
            // Cover floor with main color
            applyRectStyles();
            offscreenCtx.fillRect(0, 0, floorWidth, floorHeight);
        }

        //Draw walls
        applyLineStyles();
        for (const path of linePathArray) {
            offscreenCtx.stroke(path);
        }
    }    
    // console.timeEnd('drawLabyrinthOffscreenExecutionTime'); // End the timer
}

// Export the function to make it accessible
window.drawLabyrinthOffscreen = drawLabyrinthOffscreen;