console.log("Loading canvas manager");

let activeCanvasManager = null; // Track the active instance for cleanup

function initializeCanvasManager(canvasId, labyrinthDataset) {
    // Cleanup any existing instance
    if (activeCanvasManager) {
        activeCanvasManager.cleanup();
        activeCanvasManager = null;
    }
    let labyrinthDataSteps = labyrinthDataset[1];
    let labyrinthDataFinalState = labyrinthDataset[0];
    let labyrinthDataInitialState = [];
    for (let i = 0; i < labyrinthDataFinalState.length; i++) {
        labyrinthDataInitialState.push(new Array(labyrinthDataFinalState[0].length).fill(1));
    }

    let labyrinthData = labyrinthDataFinalState;

    // Config
    const minTileSizeInMazeCells = 10;

    // State variables
    const State = {
        animationSpeed: 0.05,
        zoomDelay: 500,
        maxZoomFactor: Math.max(((labyrinthData.length - 1) / 2)/minTileSizeInMazeCells , ((labyrinthData[0].length - 1) / 2)/minTileSizeInMazeCells),
        minZoomFactor: 1,
        isZooming: false,
        zoomFactor: 1,
        zoomTimeout: null,
        zoomIncrement: null,
        isPanning: false,
        startingPanningCoords: { x: 0, y: 0 }, // these coordinates track cursor coordinates at the time of LMB click that initialized panning

        // Below coordinates describe distance of the origin of rendered image
        // from the main canvas origin (top left corner);
        // the offset is updated when zooming and panning
        renderedImageCanvasOffsetCoords: { x: 0, y: 0 },
        // Below coordinates describe what the offset should be to not display whitespace in the main canvas
        // How to move image behind the main canvas to fill the main canvas with image
        compensatePanningOffsetCoords: { x: 0, y: 0 },
        // Below 2 variables are needed for maze redraw function when zooming/panning
        prevOffsetCoords: { x: null, y: null},
        prevZoomFactor: null,
        miniMapOrigin: null,
        miniMapDimensions: null,
        minimapTargetOffsetCoords: { x: null, y: null},
        isMinimapAnimating: false,
        mazeStyle: JSON.parse(window.localStorage.getItem('maze-style-store')),
        cellSize: null,
        mazeCellCounts: {x: null, y: null},
        mazeStyleUpdated: false,
        canvasResized: false,
        animateMazeGeneration: true,
        mazeGenerationStep: 0,
        mazeGenerationStepRendered: false,
    };

    // Canvas setup
    let canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    let ctx = canvas.getContext("2d");

    const mazeDataDimensions = {
        x: labyrinthData[0].length,
        y: labyrinthData.length
    };

    State.mazeCellCounts = keywiseOperation(mazeDataDimensions, 0, (val, _) => (val - 1) / 2);
    // Calculate cell size and adjust canvas dimensions
    // Pick smaller cell size to fit a bigger portion of the image
    State.cellSize = Math.min(
        (canvas.width * State.zoomFactor) / State.mazeCellCounts.x,
        (canvas.height * State.zoomFactor) / State.mazeCellCounts.y
    ); // shared between main and offscreen

    // Set up offscreen canvas
    let offscreenCanvas = document.createElement('canvas');
    let offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    // Data updater loop
    let updateDataID = null;
    function updateData() {
        if (!State.animateMazeGeneration) {
            return;
        }

        if (State.mazeGenerationStep >= labyrinthDataSteps.length) {
            State.animateMazeGeneration = false;
            State.mazeGenerationStep = 0;
            return;
        }

        console.log(`Updating data for maze generation ${State.mazeGenerationStep} / ${labyrinthDataSteps.length - 1}`)

        let nextStepData = labyrinthData;
        const nextStepChange = labyrinthDataSteps[State.mazeGenerationStep];
        for (const subStep of nextStepChange) {
            const nextStepChangeY = subStep[0];
            const nextStepChangeX = subStep[1];
            const nextStepChangeValue = subStep[2];
            nextStepData[nextStepChangeY][nextStepChangeX] = nextStepChangeValue;
        }
        labyrinthData = nextStepData;
        State.mazeGenerationStep++;
        State.mazeGenerationStepRendered = false;
    };
    

    // Main animation loop
    let animationFrameId = null;
    function renderLoop() {

        compensatePanning(State, canvas); 

        if (State.isMinimapAnimating) {
            
            // Handle minimap animation first
            State.renderedImageCanvasOffsetCoords = keywiseOperation(
                State.renderedImageCanvasOffsetCoords, 
                State.minimapTargetOffsetCoords,
                (origin, target) => lerp(origin, target, State.animationSpeed)
            );
            drawVisibleCells(State, canvas, ctx, offscreenCanvas, offscreenCtx, labyrinthData); // Redraw during minimap animation

            // Stop minimap animation if close enough
            if (
                Math.abs(State.renderedImageCanvasOffsetCoords.x - State.minimapTargetOffsetCoords.x) <= 0.5 &&
                Math.abs(State.renderedImageCanvasOffsetCoords.y - State.minimapTargetOffsetCoords.y) <= 0.5
            ) {
                State.renderedImageCanvasOffsetCoords = {...State.minimapTargetOffsetCoords}; // Snap to target
                State.isMinimapAnimating = false; // End minimap animation
            }
        } else if (
            // If minimap is not animating and compensation is needed
            Math.abs(State.renderedImageCanvasOffsetCoords.x - State.compensatePanningOffsetCoords.x) > 0.5 ||
            Math.abs(State.renderedImageCanvasOffsetCoords.y - State.compensatePanningOffsetCoords.y) > 0.5
        ) {
            State.renderedImageCanvasOffsetCoords = keywiseOperation(
                State.renderedImageCanvasOffsetCoords, 
                State.compensatePanningOffsetCoords,
                (origin, target) => lerp(origin, target, State.animationSpeed)
            );
            // Redraw with updated offsets
            drawVisibleCells(State, canvas, ctx, offscreenCanvas, offscreenCtx, labyrinthData);
            if (
                Math.abs(State.renderedImageCanvasOffsetCoords.x - State.compensatePanningOffsetCoords.x) <= 0.5 &&
                Math.abs(State.renderedImageCanvasOffsetCoords.y - State.compensatePanningOffsetCoords.y) <= 0.5
            ) {
                State.renderedImageCanvasOffsetCoords = {...State.compensatePanningOffsetCoords}; // Snap to target
            }
        } else {drawVisibleCells(State, canvas, ctx, offscreenCanvas, offscreenCtx, labyrinthData)};

        animationFrameId = requestAnimationFrame(renderLoop); // Keep the loop running
    };
    
    compensatePanning(State, canvas);
    State.renderedImageCanvasOffsetCoords = {...State.compensatePanningOffsetCoords};

    // Main script - draw offscreen maze, draw the same image on main canvas, listen for pan or zoom events, animate
    // Start the loop
    if (State.mazeGenerationStep === 0 && State.animateMazeGeneration) {
        labyrinthData = labyrinthDataInitialState;
    }
    updateDataID = setInterval(updateData, 0.1);
    renderLoop();

    // Cleanup function
    const cleanup = () => {
        console.log("Cleaning up canvas manager...");
        handleEventListeners(canvas, offscreenCanvas, State, mode = "remove");
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        clearInterval(updateDataID);
        updateDataID = null;

        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = 0;
        canvas.height = 0;

        offscreenCanvas.width = 0;
        offscreenCanvas.height = 0;

        offscreenCanvas = null;
        offscreenCtx = null;

        canvas = null;
        ctx = null;

        labyrinthData = null;
        labyrinthDataFinalState = null;
        labyrinthDataSteps = null;
    };
    
    // Track active manager
    activeCanvasManager = { cleanup };
    handleEventListeners(canvas, offscreenCanvas, State, mode = "attach");

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;