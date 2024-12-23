function initializeCanvasManager(canvasId, labyrinthData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr); // Scale drawing operations

    const rows = labyrinthData.length;
    const cols = labyrinthData[0].length;

    // Calculate integer cell size and adjust canvas dimensions
    const cellSize = Math.floor(canvas.width / ((cols - 1) / 2));
    canvas.width = cellSize * ((cols - 1) / 2);
    canvas.height = cellSize * ((rows - 1) / 2);

    // Set up offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCanvasCellSize = cellSize;

    //Zoom feature
    let zoomFactor = 1;
    let maxZoomFactor = 2;
    let minZoomFactor = 0.75;
        // these 2 variables describe distance of the origin of rendered imaged
        // from the main canvas
        // the offset is updated when zooming and panning
    let renderedImageCanvasOffsetX = 0;
    let renderedImageCanvasOffsetY = 0;
  
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        const mouseX = event.offsetX; // cursor position on canvas when event was triggered
        const mouseY = event.offsetY;
            // where the cursor would have pointed in the image
            // if no previous zooming or panning happened
            // translation of cursor coordinates from Image to Canvas space;
            // these operation cancel previous panning and zoom - coordinates without previous offset and zoom
            // note: zoomFactor here is the original zoom or previous applied zoom
        const worldX = (mouseX - renderedImageCanvasOffsetX) / zoomFactor; 
        const worldY = (mouseY - renderedImageCanvasOffsetY) / zoomFactor;

        if (event.deltaY < 0) {
            zoomFactor +=0.05;
        } else {
            zoomFactor -=0.05;
        }
        zoomFactor = Math.max(minZoomFactor, Math.min(zoomFactor, maxZoomFactor));

        // how much to offset the image so that the cursor is still pointing at the same thing after zoom is applied
        // world coordinates * zoomFactor = world coordinats with new zoom
        // note: zoomFactor here is new zoom
        renderedImageCanvasOffsetX = mouseX - worldX * zoomFactor;
        renderedImageCanvasOffsetY = mouseY - worldY * zoomFactor;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0); // remove all previous zoom and pan transformations - realign canvas with image
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
        ctx.setTransform(zoomFactor, 0, 0, zoomFactor, renderedImageCanvasOffsetX, renderedImageCanvasOffsetY); // Apply zoom and pan transformation
        ctx.drawImage(offscreenCanvas, 0, 0);  // Draw offscreen content onto the main canvas
    });

    // Panning Feature
    let isPanning = false;
    let startX = 0; // these coordinate track curson coordinates at the time of LMB click that initialized panning
    let startY = 0;
    canvas.addEventListener('mousedown', (event) => {
        isPanning = true; // Start panning
        startX = event.clientX; // Track starting mouse position
        startY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isPanning) return; // Only pan if mouse is pressed

        // Calculate the mouse movement (delta)
        const deltaX = (event.clientX - startX);
        const deltaY = (event.clientY - startY);

        // Update offsets based on mouse movement
        renderedImageCanvasOffsetX += deltaX;
        renderedImageCanvasOffsetY += deltaY;

        // Update start position for next frame
        startX = event.clientX;
        startY = event.clientY;

        // Redraw with updated offsets
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(zoomFactor, 0, 0, zoomFactor, renderedImageCanvasOffsetX, renderedImageCanvasOffsetY);
        ctx.drawImage(offscreenCanvas, 0, 0);
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false; // Stop panning
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false; // Stop panning if mouse leaves canvas
    });

    // Draw labyrinth offscreen, then redraw on the main canvas
    window.drawLabyrinthOffscreen(offscreenCanvasCellSize, rows, cols, offscreenCtx, labyrinthData);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(offscreenCanvas, 0, 0);  // Draw offscreen content onto the main canvas

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;