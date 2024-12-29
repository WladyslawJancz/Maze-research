function initializeCanvasManager(canvasId, labyrinthData) {
    // Config
    const animationSpeed = 0.05; // Adjust speed (0.1 = smooth, 1 = instant)
    const zoomDelay = 500; // Delay in milliseconds after the last zoom event
    const minTileSizeInMazeCells = 10;
    const maxZoomFactor = Math.min(((labyrinthData.length - 1) / 2)/minTileSizeInMazeCells , ((labyrinthData[0].length - 1) / 2)/minTileSizeInMazeCells);
    const minZoomFactor = 1;
    
    // State variables
    let isZooming = false;
    let zoomFactor = 1;
    let zoomTimeout;
    let zoomIncrement;

    let isPanning = false;
    let startPanningX = 0; // these coordinates track cursor coordinates at the time of LMB click that initialized panning
    let startPanningY = 0;

    // Below 2 variables describe distance of the origin of rendered image
    // from the main canvas origin (top left corner);
    // the offset is updated when zooming and panning
    let renderedImageCanvasOffsetX = 0;
    let renderedImageCanvasOffsetY = 0;

    // Below 2 variables describe what the offset should be to not display whitespace in the main canvas
    // How to move image behind the main canvas to fill the main canvas with image
    let compensatePanningOffsetX = 0;
    let compensatePanningOffsetY = 0;

    let prevOffsetX = null;
    let prevOffsetY = null;
    let prevZoomFactor = null;

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
        increment = 0.2; // Scale it for precision
    } else if (zoomDistance < 30) {
        // Moderate zoom, use a mid-range increment
        increment = 0.5;
    } else {
        // Far from max zoom, use a larger increment
        increment = 1; // Cap it at a reasonable max
    };

    return increment;
};

    // Canvas setup
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    const rows = labyrinthData.length;
    const cols = labyrinthData[0].length;

    // Calculate cell size and adjust canvas dimensions
    let cellSize = (canvas.width * zoomFactor) / ((cols - 1) / 2); // shared between main and offscreen

    // Set up offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    function drawVisibleCells() {
        // full virtual/world size = canvas.width * zoomFactor
        // offsets should be in virtual world size units - they include zoom
            // Avoid re-rendering if offsets and zoom are unchanged
        if (
            prevOffsetX === renderedImageCanvasOffsetX &&
            prevOffsetY === renderedImageCanvasOffsetY &&
            prevZoomFactor === zoomFactor
        ) {
            return; // No change—skip rendering
        }
        console.time('Rendering visible cells:');
        console.log('Rendering visible cells at zoom: ', zoomFactor);
        // Update cached values to the current ones
        prevOffsetX = renderedImageCanvasOffsetX;
        prevOffsetY = renderedImageCanvasOffsetY;
        prevZoomFactor = zoomFactor;

        cellCountX = ((cols - 1) / 2);
        cellCountY = ((rows - 1) / 2);
        cellSize = (canvas.width * zoomFactor) / cellCountX; // shared between main and offscreen

        // using cells indexes (0-based) below, not maze data grid coordinates
        const firstVisibleCellX = Math.max(0, Math.floor(-renderedImageCanvasOffsetX / cellSize));
        const lastVisibleCellX = Math.min(Math.ceil(((canvas.width - renderedImageCanvasOffsetX) / cellSize) -1), cellCountX);
        const firstVisibleCellY = Math.max(0, Math.floor(-renderedImageCanvasOffsetY / cellSize));
        const lastVisibleCellY = Math.min(Math.ceil(((canvas.height - renderedImageCanvasOffsetY) / cellSize) -1), cellCountY);

        const sliceStartX = firstVisibleCellX * 2;
        const sliceEndX = lastVisibleCellX * 2 + 3;
        const sliceStartY = firstVisibleCellY * 2;
        const sliceEndY = lastVisibleCellY * 2 + 3;

        console.log('Visible cells along X: ', firstVisibleCellX, ' to ', lastVisibleCellX);
        console.log('Visible cells along Y: ', firstVisibleCellY, ' to ', lastVisibleCellY);
        
        console.time('json slicing');
        const visibleCellData = labyrinthData.slice(sliceStartY, sliceEndY).map(row => row.slice(sliceStartX, sliceEndX));
        console.log('Data slice: ', 'y1 = ', sliceStartY, 'y2 = ', sliceEndY, 'x1 = ', sliceStartX, 'x2 = ', sliceEndX);
        console.timeEnd('json slicing');
        const visibleCellOffsetX = (renderedImageCanvasOffsetX >= 0) ? renderedImageCanvasOffsetX : renderedImageCanvasOffsetX % cellSize;
        const visibleCellOffsetY = (renderedImageCanvasOffsetY >= 0) ? renderedImageCanvasOffsetY : renderedImageCanvasOffsetY % cellSize;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        offscreenCtx.clearRect(0,0,offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.setTransform(1, 0, 0, 1, visibleCellOffsetX, visibleCellOffsetY);
        window.drawLabyrinthOffscreen(cellSize, visibleCellData.length, visibleCellData[0].length, offscreenCtx, visibleCellData, zoomFactor);
        ctx.drawImage(offscreenCanvas, 0, 0);
        console.timeEnd('Rendering visible cells:');

    };

    // Main animation loop
    function renderLoop() {
        if (!isPanning && !isZooming) {
            compensatePanning(); // Only compensate when no panning or zooming is happening

            renderedImageCanvasOffsetX = lerp(renderedImageCanvasOffsetX, compensatePanningOffsetX, animationSpeed);
            renderedImageCanvasOffsetY = lerp(renderedImageCanvasOffsetY, compensatePanningOffsetY, animationSpeed);
            // Redraw with updated offsets
            drawVisibleCells();

            // Stop animating when offsets are close enough to the target
            if (
                Math.abs(renderedImageCanvasOffsetX - compensatePanningOffsetX) < 0.5 &&
                Math.abs(renderedImageCanvasOffsetY - compensatePanningOffsetY) < 0.5
            ) {
                renderedImageCanvasOffsetX = compensatePanningOffsetX; // Snap to target
                renderedImageCanvasOffsetY = compensatePanningOffsetY;
            }
        }
        requestAnimationFrame(renderLoop); // Keep the loop running
    };

    //Function to automatically move (translate) canvas to avoid whitespace on screen
    function compensatePanning() {
        if (isPanning || isZooming) return;

        compensatePanningOffsetX = renderedImageCanvasOffsetX;
        compensatePanningOffsetY = renderedImageCanvasOffsetY;
        
        if (renderedImageCanvasOffsetX > 0) {
            compensatePanningOffsetX = 0;
        } else if (-1 * renderedImageCanvasOffsetX + canvas.width > offscreenCanvas.width * zoomFactor) {
            compensatePanningOffsetX = renderedImageCanvasOffsetX + (-1 * renderedImageCanvasOffsetX + canvas.width) - (offscreenCanvas.width * zoomFactor);
        } 
        if (renderedImageCanvasOffsetY > 0) {
            compensatePanningOffsetY = 0;
        } if (-1 * renderedImageCanvasOffsetY + canvas.height > offscreenCanvas.height * zoomFactor) {
            compensatePanningOffsetY = renderedImageCanvasOffsetY + (-1 * renderedImageCanvasOffsetY + canvas.height) - (offscreenCanvas.height * zoomFactor);
        }
    };
    
    // Zoom feature
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (!isZooming) isZooming = true;
        const mouseX = event.offsetX; // cursor position on canvas when event was triggered
        const mouseY = event.offsetY;

        // where the cursor would have pointed in the image
        // if no previous zooming or panning happened
        // translation of cursor coordinates from Image to Canvas space;
        // these operation cancel previous panning and zoom - coordinates without previous offset and zoom
        // note: zoomFactor here is the original zoom or previous applied zoom
        const worldX = (mouseX - renderedImageCanvasOffsetX) / zoomFactor; 
        const worldY = (mouseY - renderedImageCanvasOffsetY) / zoomFactor;

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
        renderedImageCanvasOffsetX = mouseX - worldX * zoomFactor;
        renderedImageCanvasOffsetY = mouseY - worldY * zoomFactor;
        
        drawVisibleCells();
        // Debounce the end of zooming - do not compensate panning if zooming happens in quick succession
        clearTimeout(zoomTimeout); // Clear any existing timeout
        zoomTimeout = setTimeout(() => {
            isZooming = false; // Mark zoom as complete after delay
        }, zoomDelay); // Delay in milliseconds
    });

    // Panning Feature
    canvas.addEventListener('mousedown', (event) => {
        isPanning = true; // Start panning
        startPanningX = event.clientX; // Track starting mouse position
        startPanningY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isPanning) return; // Only pan if mouse is pressed

        // Calculate the mouse movement (delta)
        const deltaX = (event.clientX - startPanningX);
        const deltaY = (event.clientY - startPanningY);

        // Update offsets based on mouse movement
        renderedImageCanvasOffsetX += deltaX;
        renderedImageCanvasOffsetY += deltaY;

        // Update start position for next frame
        startPanningX = event.clientX;
        startPanningY = event.clientY;
        
        // Redraw with updated offsets
        drawVisibleCells();
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false; // Stop panning
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false; // Stop panning if mouse leaves canvas
    });

    // Main script - draw offscreen maze, draw the same image on main canvas, listen for pan or zoom events, animate
    // Draw labyrinth offscreen, then redraw on the main canvas
    window.drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData, zoomFactor);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(offscreenCanvas, 0, 0);  // Draw offscreen content onto the main canvas
    // Start the loop
    renderLoop();

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;