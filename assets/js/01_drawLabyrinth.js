// Define the drawing logic globally
function drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData, zoomLevel=1, mazeStyle, useMultiColorFloor=false) {
    // Main drawing function:
    // Given maze data to render and other variables, renders maze in offscreen canvas
    // Draws walls using Path2D API
    // Renders floor either as 1 a signle rect or ImageData that is later scaled up to canvas size
    // Draws a large 500x500 maze at cell size of <4px
    // Disable anti-aliasing
    offscreenCtx.imageSmoothingEnabled = false;

    // Dynamic checkered mode for small scales
    // Use checkered mode if cell size is smaller than N px
    const useCheckeredMode = cellSize <= 3;
    // Configuration constants
    // const batchSize = 500;
    const rectStyle = { fill: mazeStyle.pathFill, stroke: mazeStyle.pathFill, lineWidth: 1 };
    const lineStyle = { stroke: mazeStyle.wallStroke,
                        lineWidth: Math.max(Math.round((cellSize * 0.1)), 1), 
                        lineCap: "square", 
                        lineJoin: "square",
    };

    // Predefine path
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
    }

    // Loop over all cells, render only walls
    
    if (useCheckeredMode) {
        // Draw a simple pattern to instead of full maze when cell size < threshold
        // Allows to keep rendering fast at zoomed-out state for large mazes when no details can be seen anyway, and visual artifacts are present

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
        // Draw full detailed maze

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
     
        // Pre-calculate the width and height of the floor
        const numCellsCols = (cols - 1) / 2;
        const numCellsRows = (rows - 1) / 2;
        const floorWidth = numCellsCols * cellSize;
        const floorHeight = numCellsRows * cellSize;

        // Prepare floor image as imageData - perform only during maze generation animation
        if (useMultiColorFloor) {
            const mazeFloorColors = [ // implementation for DFS maze generation.
                hexToRgba(mazeStyle.pathFill), // index 0, value 0 in the data, clear visited backtracked cell
                hexToRgba(mazeStyle.wallStroke, 128), // index 1, value 1, unvisited cell / wall
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
            // Create buffer background (floor) canvas to allow scaling on image data
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
            // Cover floor with main color in one draw call of a single rect
            applyRectStyles();
            offscreenCtx.fillRect(0, 0, floorWidth, floorHeight);
        }

        //Draw walls
        applyLineStyles();
        offscreenCtx.stroke(linePath);
    }    
}

// Export the function to make it accessible
window.drawLabyrinthOffscreen = drawLabyrinthOffscreen;