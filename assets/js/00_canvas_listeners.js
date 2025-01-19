console.log("Loading canvas listeners");
const zoomHandler = (event, State) => {
    State.isMinimapAnimating = false; // Cancel minimap animation
    event.preventDefault();
    if (!State.isZooming) State.isZooming = true;
    const mousePosition = { // cursor position on canvas when event was triggered
        x: event.offsetX,
        y: event.offsetY
    };

    // where the cursor would have pointed in the image
    // if no previous zooming or panning happened
    // translation of cursor coordinates from Image to Canvas space;
    // these operation cancel previous panning and zoom - coordinates without previous offset and zoom
    // note: zoomFactor here is the original zoom or previous applied zoom
    const worldPosition = keywiseOperation(mousePosition, State.renderedImageCanvasOffsetCoords, (mouse, offset) => (mouse - offset) / State.zoomFactor);

    zoomIncrement = getZoomIncrement(State.zoomFactor, State.maxZoomFactor);

    if (event.deltaY < 0) {
        State.zoomFactor +=zoomIncrement;
    } else {
        State.zoomFactor -=zoomIncrement;
    }
    State.zoomFactor = Math.max(State.minZoomFactor, Math.min(State.zoomFactor, State.maxZoomFactor));

    // how much to offset the image so that the cursor is still pointing at the same thing after zoom is applied
    // world coordinates * zoomFactor = world coordinats with new zoom
    // note: zoomFactor here is new zoom
    State.renderedImageCanvasOffsetCoords = keywiseOperation(mousePosition, worldPosition, (m, w) => m - w * State.zoomFactor);

    clearTimeout(State.zoomTimeout); // Clear any existing timeout
    State.zoomTimeout = setTimeout(() => {
        State.isZooming = false; // Mark zoom as complete after delay
    }, State.zoomDelay); // Delay in milliseconds
};

const panningStarter = (event, State) => {
    State.isMinimapAnimating = false; // Cancel minimap animation
    State.isPanning = true; // Start panning
    State.startingPanningCoords.x = event.clientX; // Track starting mouse position
    State.startingPanningCoords.y = event.clientY;
};

const panningHandler = (event, State) => {
    if (!State.isPanning) return; // Only pan if mouse is pressed

    // Calculate the mouse movement (delta)
    const deltaCoords = {
        x: event.clientX - State.startingPanningCoords.x,
        y: event.clientY - State.startingPanningCoords.y
    };

    // Update start position for next frame
    State.startingPanningCoords.x = event.clientX;
    State.startingPanningCoords.y = event.clientY;

    // Update offsets based on mouse movement
    State.renderedImageCanvasOffsetCoords = keywiseOperation(State.renderedImageCanvasOffsetCoords, deltaCoords, (coords, delta) => coords + delta);
    
};

const panningStopper = (State) => {
    State.isPanning = false;
};

const minimapOnClickMover = (event, State, canvas) => {
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    // Check if the click is inside the mini-map bounds
    if (
        mouseX >= State.miniMapOrigin.x &&
        mouseX <= State.miniMapOrigin.x + State.miniMapDimensions.x &&
        mouseY >= State.miniMapOrigin.y &&
        mouseY <= State.miniMapOrigin.y + State.miniMapDimensions.y
    ) {
        // Calculate the relative position inside the mini-map
        const scale = keywiseOperation(State.miniMapDimensions, State.mazeCellCounts, (mapDim, cell_count) => mapDim / cell_count);

        // Calculate the corresponding coordinates in the main canvas
        const targetX = (mouseX - State.miniMapOrigin.x) / scale.x; // Corresponding X in the main maze
        const targetY = (mouseY - State.miniMapOrigin.y) / scale.y; // Corresponding Y in the main maze

        // Update the offsets to center the viewport on the clicked position
        // Ensure the center of the clicked position on the mini-map corresponds to the center on the full canvas
        State.minimapTargetOffsetCoords.x = -(targetX * State.cellSize) + canvas.width / 2;
        State.minimapTargetOffsetCoords.y = -(targetY * State.cellSize) + canvas.height / 2;

        // Clamp the offsets to avoid scrolling out of bounds
        State.minimapTargetOffsetCoords.x = Math.min(0, Math.max(State.minimapTargetOffsetCoords.x, -State.mazeCellCounts.x * State.cellSize + canvas.width));
        State.minimapTargetOffsetCoords.y = Math.min(0, Math.max(State.minimapTargetOffsetCoords.y, -State.mazeCellCounts.y * State.cellSize + canvas.height));

        State.isMinimapAnimating = true; // Start minimap animation
    }
};

const mazeStyleUpdateHandler = (State) => {
    State.mazeStyle = JSON.parse(window.localStorage.getItem('maze-style-store'));
    State.mazeStyleUpdated = true;
};

const mazeResizer = (State, canvas, offscreenCanvas) => {
    const prevCanvasWidth = canvas.width;
    const prevCanvasHeight = canvas.height;

    const rect = canvas.getBoundingClientRect();
    console.log("Maze resize triggered", rect)
    canvas.width = rect.width;
    canvas.height = rect.height;
    // let ctx = canvas.getContext("2d");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    State.renderedImageCanvasOffsetCoords.x = State.renderedImageCanvasOffsetCoords.x + (canvas.width - prevCanvasWidth) / 2;
    State.renderedImageCanvasOffsetCoords.y = State.renderedImageCanvasOffsetCoords.y + (canvas.height - prevCanvasHeight) / 2;
    // State.cellSize = Math.min(
    //     (canvas.width * State.zoomFactor) / State.mazeCellCounts.x,
    //     (canvas.height * State.zoomFactor) / State.mazeCellCounts.y
    // );



    State.canvasResized = true;
}

function handleEventListeners(canvas, offscreenCanvas, State, mode = 'attach') {

    // Store handlers in the State object to ensure consistent references
    if (!State.handlers) {
        State.handlers = {
            zoomHandlerFn: (event) => zoomHandler(event, State),
            panningStarterFn: (event) => panningStarter(event, State),
            panningHandlerFn: (event) => panningHandler(event, State),
            panningStopperFn: () => panningStopper(State),
            minimapOnClickMoverFn: (event) => minimapOnClickMover(event, State, canvas),
            mazeStyleUpdateHandlerFn: () => mazeStyleUpdateHandler(State),
            mazeResizerFn: () => mazeResizer(State, canvas, offscreenCanvas)
        };
    }

    const listeners = [
        // Zoom feature
        {
            type: 'wheel',
            handler: State.handlers.zoomHandlerFn,
        },
        // Panning feature
        {
            type: 'mousedown',
            handler: State.handlers.panningStarterFn
        },
        {
            type: 'mousemove',
            handler: State.handlers.panningHandlerFn
        },
        {
            type: 'mouseup',
            handler: State.handlers.panningStopperFn
        },
        {
            type: 'mouseleave',
            handler: State.handlers.panningStopperFn
        },
        // Mini-map click-to-move
        {
            type: 'click',
            handler: State.handlers.minimapOnClickMoverFn
        },
        // Dynamic recoloring support
        {
            type: 'mazeStyleUpdated',
            handler: State.handlers.mazeStyleUpdateHandlerFn,
            target: window, // Optional: Bind to a different target
        },
        {
            type: 'resize',
            handler: State.handlers.mazeResizerFn,
            target: window
        }
    ];

    // Determine action based on the mode
    listeners.forEach(({ type, handler, target = canvas }) => {
        if (mode === 'attach') {
            target.addEventListener(type, handler);
        } else if (mode === 'remove') {
            target.removeEventListener(type, handler);
        } else {
            console.error(`Unknown mode: ${mode}`);
        }
    });
}