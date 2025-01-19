// Utility function to perform operation on objects, used here to operate on coordinates
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

//Function to automatically move (translate) canvas to avoid whitespace on screen
function compensatePanning(State, canvas) {
    State.compensatePanningOffsetCoords = {...State.renderedImageCanvasOffsetCoords}; // update compensation coordinates 

    // center image if image is smaller then canvas,
    // align left or right border if margin is visible only from left or right
    if (!State.isPanning && !State.isZooming) { // compensate only if not zooming and not panning
        const mazeWidth = State.mazeCellCounts.x * State.cellSize;
        const mazeHeight = State.mazeCellCounts.y * State.cellSize;

        if (mazeWidth < canvas.width) {
            State.compensatePanningOffsetCoords.x = (canvas.width - mazeWidth) / 2;
        } else if (mazeWidth >= canvas.width && State.renderedImageCanvasOffsetCoords.x > 0) {
            State.compensatePanningOffsetCoords.x = 0;
        } else if (mazeWidth >= canvas.width && -State.renderedImageCanvasOffsetCoords.x > mazeWidth - canvas.width) {
            State.compensatePanningOffsetCoords.x = -(mazeWidth - canvas.width);
        }

        if (mazeHeight < canvas.height) {
            State.compensatePanningOffsetCoords.y = (canvas.height - mazeHeight) / 2;
        } else if (mazeHeight >= canvas.height && State.renderedImageCanvasOffsetCoords.y > 0) {
            State.compensatePanningOffsetCoords.y = 0;
        } else if (mazeHeight >= canvas.height && -State.renderedImageCanvasOffsetCoords.y > mazeHeight - canvas.height) {
            State.compensatePanningOffsetCoords.y = -(mazeHeight - canvas.height);
        }
    }
};

function drawVisibleCells(State, canvas, ctx, offscreenCanvas, offscreenCtx, labyrinthData) {
    // full virtual/world size = canvas.width * zoomFactor
    // offsets should be in virtual world size units - they include zoom
    // Avoid re-rendering if offsets and zoom are unchanged
    if (
        Object.values(
            keywiseOperation(State.prevOffsetCoords, State.renderedImageCanvasOffsetCoords, (x,y) => (x === y)) // prevOffset same as renderedImageCanvasOffset
        ).every(val => val === true) &&
        State.prevZoomFactor === State.zoomFactor &&
        State.mazeStyleUpdated === false
    ) {
        return; // No change — skip rendering
    }
    console.time('drawVisibleCells');

    // Update cached values to the current ones
    State.mazeStyleUpdated = false;
    State.prevOffsetCoords = {...State.renderedImageCanvasOffsetCoords};
    State.prevZoomFactor = State.zoomFactor;

    State.cellSize = Math.min(
        (canvas.width * State.zoomFactor) / State.mazeCellCounts.x,
        (canvas.height * State.zoomFactor) / State.mazeCellCounts.y
    ); // shared between main and offscreen

    // using cells indexes (0-based) below, not maze data grid coordinates
    const firstVisibleCellCoords = keywiseOperation(State.renderedImageCanvasOffsetCoords, 0, (coord, _) => (Math.max(0, Math.floor(-coord / State.cellSize))));
    const lastVisibleCellCoords = {
        x: Math.min(Math.ceil(((canvas.width - State.renderedImageCanvasOffsetCoords.x) / State.cellSize) -1), State.mazeCellCounts.x),
        y: Math.min(Math.ceil(((canvas.height - State.renderedImageCanvasOffsetCoords.y) / State.cellSize) -1), State.mazeCellCounts.y)
    };

    // slicing maze data grid/ json array
    const sliceStartCoords = keywiseOperation(firstVisibleCellCoords, 0, (coord, _) => coord * 2);
    const sliceEndCoords = keywiseOperation(lastVisibleCellCoords, 0, (coord, _) => coord * 2 + 3);

    const visibleCellData = labyrinthData.slice(sliceStartCoords.y, sliceEndCoords.y).map(row => row.slice(sliceStartCoords.x, sliceEndCoords.x));
    const visibleCellOffsetCoords = keywiseOperation(State.renderedImageCanvasOffsetCoords, State.cellSize, (offset, cell_size) => (offset >= 0) ? offset : offset % cell_size);

    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

    offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    offscreenCtx.clearRect(0,0,offscreenCanvas.width, offscreenCanvas.height);
    offscreenCtx.setTransform(1, 0, 0, 1, visibleCellOffsetCoords.x, visibleCellOffsetCoords.y);
    window.drawLabyrinthOffscreen(State.cellSize, visibleCellData.length, visibleCellData[0].length, offscreenCtx, visibleCellData, State.zoomFactor, State.mazeStyle);
    ctx.drawImage(offscreenCanvas, 0, 0);
    
    // Mini-map dimensions ( max 10% of canvas along smaller dimension)
    const miniMapSizeFactor = Math.max(
        (State.mazeCellCounts.x * State.cellSize) / (canvas.width * 0.1),
        (State.mazeCellCounts.y * State.cellSize) / (canvas.height * 0.1)
    );
    State.miniMapDimensions = keywiseOperation(State.mazeCellCounts, 0, (cells, _) => cells * State.cellSize / miniMapSizeFactor);

    // Mini-map position (bottom-right corner)
    State.miniMapOrigin = {
        x: canvas.width - State.miniMapDimensions.x - 10,
        y: canvas.height - State.miniMapDimensions.y - 30,
    }

    // Scale factors for mini-map
    const miniMapScale = keywiseOperation(State.miniMapDimensions, State.mazeCellCounts, (dimension, cell_count) => dimension / cell_count);

    // Draw mini-map background
    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)'; // Light gray background
    ctx.fillRect(State.miniMapOrigin.x, State.miniMapOrigin.y, State.miniMapDimensions.x, State.miniMapDimensions.y);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Border
    ctx.strokeRect(State.miniMapOrigin.x, State.miniMapOrigin.y, State.miniMapDimensions.x, State.miniMapDimensions.y);

    // Calculate viewport position inside mini-map
    const viewportOrigin = {
        x: State.miniMapOrigin.x + (-State.renderedImageCanvasOffsetCoords.x / State.cellSize) * miniMapScale.x,
        y: State.miniMapOrigin.y + (-State.renderedImageCanvasOffsetCoords.y / State.cellSize) * miniMapScale.y
    };
    const viewportDimensions = {
        x: (canvas.width / State.cellSize) * miniMapScale.x,
        y: (canvas.height / State.cellSize) * miniMapScale.y,
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
    const text = `Zoom: ${State.zoomFactor.toFixed(2)}x`;
    ctx.fillText(text, canvas.width - 10, canvas.height - 10);

    // Draw scale indicator
    let scaleIndicatorSize = 0;
    const indicatorSizeInCells = (canvas.width * 0.1) / State.cellSize;
    const divisors = [10, 5, 1, 0.5];
    
    // Loop through divisors and find the first match
    for (let divisor of divisors) {
        const indicatorSizeRounded = Math.floor(indicatorSizeInCells / divisor);
        if (indicatorSizeRounded > 0) {
            scaleIndicatorSize = indicatorSizeRounded * divisor; // Set the size based on divisor
            break; // Exit loop early once a match is found
        }
    }
    const scaleIndicatorLength = scaleIndicatorSize * State.cellSize;
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