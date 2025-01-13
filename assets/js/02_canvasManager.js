function initializeCanvasManager(canvasId, labyrinthData) {
    // Config
    const animationSpeed = 0.05; // Adjust speed (0.1 = smooth, 1 = instant)
    const zoomDelay = 500; // Delay in milliseconds after the last zoom event
    const minTileSizeInMazeCells = 10;
    const maxZoomFactor = Math.max(((labyrinthData.length - 1) / 2)/minTileSizeInMazeCells , ((labyrinthData[0].length - 1) / 2)/minTileSizeInMazeCells);
    const minZoomFactor = 1;
    
    // State variables
    let isZooming = false;
    let zoomFactor = 1;
    let zoomTimeout;
    let zoomIncrement;

    let isPanning = false;
    let startingPanningCoords = { x: 0, y: 0 } // these coordinates track cursor coordinates at the time of LMB click that initialized panning
  

    // Below coordinates describe distance of the origin of rendered image
    // from the main canvas origin (top left corner);
    // the offset is updated when zooming and panning
    let renderedImageCanvasOffsetCoords = { x: 0, y: 0 };

    // Below coordinates describe what the offset should be to not display whitespace in the main canvas
    // How to move image behind the main canvas to fill the main canvas with image
    let compensatePanningOffsetCoords = { x: 0, y: 0 };

    // Below 3 variables are needed for maze redraw function when zooming/panning
    let prevOffsetCoords = { x: null, y: null};
    let prevZoomFactor = null;

    // Minimap variables
    let miniMapOrigin, miniMapDimensions;
    let minimapTargetOffsetCoords = { x: null, y: null};
    let isMinimapAnimating = false;

    // Maze style
    let mazeStyle = JSON.parse(window.localStorage.getItem('maze-style-store'));

    // Utility function used for animation
    function lerp(start, end, t) {
        return start * (1 - t) + end * t; // Linear interpolation formula
    }

    // Utility function to get zoom increment based on current and maximum zoom levels
    function getZoomIncrement(currentZoom, maxZoom) {
        const zoomDistance = Math.round(maxZoom - currentZoom);
        // Determine the increment based on zoom distance
        let increment;

        if (zoomDistance < 10) {
            // Close to max zoom, use a small increment (fine-grained zooming)
            increment = 0.25; // Scale it for precision
        } else if (zoomDistance < 30) {
            // Moderate zoom, use a mid-range increment
            increment = 0.5;
        } else {
            // Far from max zoom, use a larger increment
            increment = 1; // Cap it at a reasonable max
        };

        return increment;
    };

    function keywiseOperation(arg1, arg2, operation) {
        const result = {};
        // Check if the second argument is an object or a number
        if (typeof arg2 === 'object' && arg2 !== null && !Array.isArray(arg2)) {
        // obj2OrNum is an object: Perform key-wise operations
        for (const key of Object.keys(arg1)) {
            if (arg2.hasOwnProperty(key)) {
            result[key] = operation(arg1[key], arg2[key]);
            } else {
            throw new Error(`Key "${key}" is missing in the second object`);
            }
        }
        } else if (typeof arg2 === 'number') {
        // obj2OrNum is a number: Perform operations with a scalar
        for (const key of Object.keys(arg1)) {
            result[key] = operation(arg1[key], arg2);
        }
        } else {
        throw new Error("Second argument must be either an object or a number");
        }

        return result;
    }

    // Canvas setup
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    const mazeDataDimensions = {
        x: labyrinthData[0].length,
        y: labyrinthData.length
    };

    const mazeCellCounts = keywiseOperation(mazeDataDimensions, 0, (val, _) => (val - 1) / 2);
    // Calculate cell size and adjust canvas dimensions
    // Pick smaller cell size to fit a bigger portion of the image
    let cellSize = Math.min(
        (canvas.width * zoomFactor) / mazeCellCounts.x,
        (canvas.height * zoomFactor) / mazeCellCounts.y
    ); // shared between main and offscreen

    // Set up offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    function drawVisibleCells(forceDraw=false) {
        // full virtual/world size = canvas.width * zoomFactor
        // offsets should be in virtual world size units - they include zoom
            // Avoid re-rendering if offsets and zoom are unchanged
        console.time('drawVisibleCells');
        if (
            Object.values(
                keywiseOperation(prevOffsetCoords, renderedImageCanvasOffsetCoords, (x,y) => (x === y)) // prevOffset same as renderedImageCanvasOffset
            ).every(val => val === true) &&
            prevZoomFactor === zoomFactor &&
            forceDraw === false
        ) {
            return; // No change — skip rendering
        }

        // console.time('Rendering visible cells:');
        // console.log('Rendering visible cells at zoom: ', zoomFactor);
        // Update cached values to the current ones
        prevOffsetCoords = {...renderedImageCanvasOffsetCoords};
        prevZoomFactor = zoomFactor;

        cellSize = Math.min(
            (canvas.width * zoomFactor) / mazeCellCounts.x,
            (canvas.height * zoomFactor) / mazeCellCounts.y
        ); // shared between main and offscreen

        // using cells indexes (0-based) below, not maze data grid coordinates
        const firstVisibleCellCoords = keywiseOperation(renderedImageCanvasOffsetCoords, 0, (coord, _) => (Math.max(0, Math.floor(-coord / cellSize))));
        const lastVisibleCellCoords = {
            x: Math.min(Math.ceil(((canvas.width - renderedImageCanvasOffsetCoords.x) / cellSize) -1), mazeCellCounts.x),
            y: Math.min(Math.ceil(((canvas.height - renderedImageCanvasOffsetCoords.y) / cellSize) -1), mazeCellCounts.y)
        };

        // slicing maze data grid/ json array
        const sliceStartCoords = keywiseOperation(firstVisibleCellCoords, 0, (coord, _) => coord * 2);
        const sliceEndCoords = keywiseOperation(lastVisibleCellCoords, 0, (coord, _) => coord * 2 + 3);

        // console.log('Visible cells along X: ', firstVisibleCellX, ' to ', lastVisibleCellX);
        // console.log('Visible cells along Y: ', firstVisibleCellY, ' to ', lastVisibleCellY);
        
        // console.time('json slicing');
        const visibleCellData = labyrinthData.slice(sliceStartCoords.y, sliceEndCoords.y).map(row => row.slice(sliceStartCoords.x, sliceEndCoords.x));
        // console.log('Data slice: ', 'y1 = ', sliceStartY, 'y2 = ', sliceEndY, 'x1 = ', sliceStartX, 'x2 = ', sliceEndX);
        // console.timeEnd('json slicing');
        const visibleCellOffsetCoords = keywiseOperation(renderedImageCanvasOffsetCoords, cellSize, (offset, cell_size) => (offset >= 0) ? offset : offset % cell_size);

        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        offscreenCtx.clearRect(0,0,offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.setTransform(1, 0, 0, 1, visibleCellOffsetCoords.x, visibleCellOffsetCoords.y);
        window.drawLabyrinthOffscreen(cellSize, visibleCellData.length, visibleCellData[0].length, offscreenCtx, visibleCellData, zoomFactor, mazeStyle);
        ctx.drawImage(offscreenCanvas, 0, 0);
        
        // Mini-map dimensions ( max 10% of canvas along smaller dimension)
        const miniMapSizeFactor = Math.max(
            (mazeCellCounts.x * cellSize) / (canvas.width * 0.1),
            (mazeCellCounts.y * cellSize) / (canvas.height * 0.1)
        );
        miniMapDimensions = keywiseOperation(mazeCellCounts, 0, (cells, _) => cells * cellSize / miniMapSizeFactor);

        // Mini-map position (bottom-right corner)
        miniMapOrigin = {
            x: canvas.width - miniMapDimensions.x - 10,
            y: canvas.height - miniMapDimensions.y - 30,
        }

        // Scale factors for mini-map
        const miniMapScale = keywiseOperation(miniMapDimensions, mazeCellCounts, (dimension, cell_count) => dimension / cell_count);

        // Draw mini-map background
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)'; // Light gray background
        ctx.fillRect(miniMapOrigin.x, miniMapOrigin.y, miniMapDimensions.x, miniMapDimensions.y);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Border
        ctx.strokeRect(miniMapOrigin.x, miniMapOrigin.y, miniMapDimensions.x, miniMapDimensions.y);

        // Calculate viewport position inside mini-map
        const viewportOrigin = {
            x: miniMapOrigin.x + (-renderedImageCanvasOffsetCoords.x / cellSize) * miniMapScale.x,
            y: miniMapOrigin.y + (-renderedImageCanvasOffsetCoords.y / cellSize) * miniMapScale.y
        };
        const viewportDimensions = {
            x: (canvas.width / cellSize) * miniMapScale.x,
            y: (canvas.height / cellSize) * miniMapScale.y,
        };


        // Draw viewport rectangle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white
        ctx.fillRect(viewportOrigin.x, viewportOrigin.y, viewportDimensions.x, viewportDimensions.y);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Border
        ctx.strokeRect(viewportOrigin.x, viewportOrigin.y, viewportDimensions.x, viewportDimensions.y);

        // Set styles for text rendering
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Draw the zoom level at bottom-right corner
        const text = `Zoom: ${zoomFactor.toFixed(2)}x`;
        ctx.fillText(text, canvas.width - 10, canvas.height - 10);

        // Draw scale indicator
        let scaleIndicatorSize = 0;
        const indicatorSizeInCells = (canvas.width * 0.1) / cellSize;
        const divisors = [10, 5, 1, 0.5];
        
        // Loop through divisors and find the first match
        for (let divisor of divisors) {
            const indicatorSizeRounded = Math.floor(indicatorSizeInCells / divisor);
            if (indicatorSizeRounded > 0) {
                scaleIndicatorSize = indicatorSizeRounded * divisor; // Set the size based on divisor
                break; // Exit loop early once a match is found
            }
        }
        const scaleIndicatorLength = scaleIndicatorSize * cellSize;
        const scaleIndicatorText = `${scaleIndicatorSize} ${scaleIndicatorSize === 1 ? 'cell' : 'cells'}`;
        ctx.beginPath();
        ctx.moveTo(10, canvas.height - 10);
        ctx.lineTo(10 + scaleIndicatorLength, canvas.height - 10);
        ctx.moveTo(10, canvas.height - 13);
        ctx.lineTo(10, canvas.height - 7);
        ctx.moveTo(10 + scaleIndicatorLength, canvas.height - 13);
        ctx.lineTo(10 + scaleIndicatorLength, canvas.height - 7);
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillText(scaleIndicatorText, 8, canvas.height - 15);


        console.timeEnd('drawVisibleCells');

    };

    // Main animation loop
    function renderLoop() {
        if (!isPanning && !isZooming) {
            compensatePanning(); // Only compensate when no panning or zooming is happening
            // console.log("compens cond", Math.abs(renderedImageCanvasOffsetCoords.x), Math.abs(compensatePanningOffsetCoords.x));

            if (isMinimapAnimating) {
                
                // Handle minimap animation first
                renderedImageCanvasOffsetCoords = keywiseOperation(
                    renderedImageCanvasOffsetCoords, 
                    minimapTargetOffsetCoords,
                    (origin, target) => lerp(origin, target, animationSpeed)
                );
                drawVisibleCells(); // Redraw during minimap animation
    
                // Stop minimap animation if close enough
                if (
                    Math.abs(renderedImageCanvasOffsetCoords.x - minimapTargetOffsetCoords.x) <= 0.5 &&
                    Math.abs(renderedImageCanvasOffsetCoords.y - minimapTargetOffsetCoords.y) <= 0.5
                ) {
                    renderedImageCanvasOffsetCoords = {...minimapTargetOffsetCoords}; // Snap to target
                    isMinimapAnimating = false; // End minimap animation
                }
            } else if (
                // If minimap is not animating and compensation is needed
                Math.abs(renderedImageCanvasOffsetCoords.x - compensatePanningOffsetCoords.x) > 0.5 ||
                Math.abs(renderedImageCanvasOffsetCoords.y - compensatePanningOffsetCoords.y) > 0.5
            ) {
                renderedImageCanvasOffsetCoords = keywiseOperation(
                    renderedImageCanvasOffsetCoords, 
                    compensatePanningOffsetCoords,
                    (origin, target) => lerp(origin, target, animationSpeed)
                );
                // Redraw with updated offsets
                drawVisibleCells();
                if (
                    Math.abs(renderedImageCanvasOffsetCoords.x - compensatePanningOffsetCoords.x) <= 0.5 &&
                    Math.abs(renderedImageCanvasOffsetCoords.y - compensatePanningOffsetCoords.y) <= 0.5
                ) {
                    renderedImageCanvasOffsetCoords = {...compensatePanningOffsetCoords}; // Snap to target
                }
            }
        }
        requestAnimationFrame(renderLoop); // Keep the loop running
    };

    //Function to automatically move (translate) canvas to avoid whitespace on screen
    function compensatePanning() {
        if (isPanning || isZooming) return;

        compensatePanningOffsetCoords = {...renderedImageCanvasOffsetCoords};

        const mazeWidth = mazeCellCounts.x * cellSize;
        const mazeHeight = mazeCellCounts.y * cellSize;
        // center image if image is smaller then canvas,
        // align left or right border if margin is visible only from left or right
        if (mazeWidth < canvas.width) {
            compensatePanningOffsetCoords.x = (canvas.width - mazeWidth) / 2;
        } else if (mazeWidth >= canvas.width && renderedImageCanvasOffsetCoords.x > 0) {
            compensatePanningOffsetCoords.x = 0;
        } else if (mazeWidth >= canvas.width && -renderedImageCanvasOffsetCoords.x > mazeWidth - canvas.width) {
            compensatePanningOffsetCoords.x = -(mazeWidth - canvas.width);
        }

        if (mazeHeight < canvas.height) {
            compensatePanningOffsetCoords.y = (canvas.height - mazeHeight) / 2;
        } else if (mazeHeight >= canvas.height && renderedImageCanvasOffsetCoords.y > 0) {
            compensatePanningOffsetCoords.y = 0;
        } else if (mazeHeight >= canvas.height && -renderedImageCanvasOffsetCoords.y > mazeHeight - canvas.height) {
            compensatePanningOffsetCoords.y = -(mazeHeight - canvas.height);
        }
    };
    
    // Zoom feature
    canvas.addEventListener('wheel', (event) => {
        isMinimapAnimating = false; // Cancel minimap animation
        event.preventDefault();
        if (!isZooming) isZooming = true;
        const mousePosition = { // cursor position on canvas when event was triggered
            x: event.offsetX,
            y: event.offsetY
        }

        // where the cursor would have pointed in the image
        // if no previous zooming or panning happened
        // translation of cursor coordinates from Image to Canvas space;
        // these operation cancel previous panning and zoom - coordinates without previous offset and zoom
        // note: zoomFactor here is the original zoom or previous applied zoom
        const worldPosition = keywiseOperation(mousePosition, renderedImageCanvasOffsetCoords, (mouse, offset) => (mouse - offset) / zoomFactor);

        zoomIncrement = getZoomIncrement(zoomFactor, maxZoomFactor);

        if (event.deltaY < 0) {
            zoomFactor +=zoomIncrement;
        } else {
            zoomFactor -=zoomIncrement;
        }
        zoomFactor = Math.max(minZoomFactor, Math.min(zoomFactor, maxZoomFactor));

        // how much to offset the image so that the cursor is still pointing at the same thing after zoom is applied
        // world coordinates * zoomFactor = world coordinats with new zoom
        // note: zoomFactor here is new zoom
        renderedImageCanvasOffsetCoords = keywiseOperation(mousePosition, worldPosition, (m, w) => m - w * zoomFactor);
        
        drawVisibleCells();
        // Debounce the end of zooming - do not compensate panning if zooming happens in quick succession
        clearTimeout(zoomTimeout); // Clear any existing timeout
        zoomTimeout = setTimeout(() => {
            isZooming = false; // Mark zoom as complete after delay
        }, zoomDelay); // Delay in milliseconds
    });

    // Panning Feature
    canvas.addEventListener('mousedown', (event) => {
        isMinimapAnimating = false; // Cancel minimap animation
        isPanning = true; // Start panning
        startingPanningCoords.x = event.clientX; // Track starting mouse position
        startingPanningCoords.y = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isPanning) return; // Only pan if mouse is pressed

        // Calculate the mouse movement (delta)
        const deltaCoords = {
            x: event.clientX - startingPanningCoords.x,
            y: event.clientY - startingPanningCoords.y
        };

        // Update offsets based on mouse movement
        renderedImageCanvasOffsetCoords = keywiseOperation(renderedImageCanvasOffsetCoords, deltaCoords, (coords, delta) => coords + delta);

        // Update start position for next frame
        startingPanningCoords.x = event.clientX;
        startingPanningCoords.y = event.clientY;
        
        // Redraw with updated offsets
        drawVisibleCells();
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false; // Stop panning
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false; // Stop panning if mouse leaves canvas
    });

    // Click-to-move support for mini-map
    canvas.addEventListener('click', (e) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        // Check if the click is inside the mini-map bounds
        if (
            mouseX >= miniMapOrigin.x &&
            mouseX <= miniMapOrigin.x + miniMapDimensions.x &&
            mouseY >= miniMapOrigin.y &&
            mouseY <= miniMapOrigin.y + miniMapDimensions.y
        ) {
            // Calculate the relative position inside the mini-map
            const scale = keywiseOperation(miniMapDimensions, mazeCellCounts, (mapDim, cell_count) => mapDim / cell_count);

            // Calculate the corresponding coordinates in the main canvas
            const targetX = (mouseX - miniMapOrigin.x) / scale.x; // Corresponding X in the main maze
            const targetY = (mouseY - miniMapOrigin.y) / scale.y; // Corresponding Y in the main maze

            // Update the offsets to center the viewport on the clicked position
            // Ensure the center of the clicked position on the mini-map corresponds to the center on the full canvas
            minimapTargetOffsetCoords.x = -(targetX * cellSize) + canvas.width / 2;
            minimapTargetOffsetCoords.y = -(targetY * cellSize) + canvas.height / 2;

            // Clamp the offsets to avoid scrolling out of bounds
            minimapTargetOffsetCoords.x = Math.min(0, Math.max(minimapTargetOffsetCoords.x, -mazeCellCounts.x * cellSize + canvas.width));
            minimapTargetOffsetCoords.y = Math.min(0, Math.max(minimapTargetOffsetCoords.y, -mazeCellCounts.y * cellSize + canvas.height));

            isMinimapAnimating = true; // Start minimap animation
        }
    });

    // Styling
    // Dynamic recoloring support
    window.addEventListener('mazeStyleUpdated', (event) => {
        mazeStyle = JSON.parse(window.localStorage.getItem('maze-style-store'));
        drawVisibleCells(true);
    });

    compensatePanning();
    renderedImageCanvasOffsetCoords = {...compensatePanningOffsetCoords};

    // Main script - draw offscreen maze, draw the same image on main canvas, listen for pan or zoom events, animate
    drawVisibleCells();
    // Start the loop
    renderLoop();

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;