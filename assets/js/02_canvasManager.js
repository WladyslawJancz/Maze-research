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
    let mouseZoomOffsetX = 0;
    let mouseZoomOffsetY = 0;

    // Panning Variables
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        const worldX = (mouseX - mouseZoomOffsetX) / zoomFactor;
        const worldY = (mouseY - mouseZoomOffsetY) / zoomFactor;

        if (event.deltaY < 0) {
            zoomFactor +=0.05;
        } else {
            zoomFactor -=0.05;
        }
        zoomFactor = Math.max(minZoomFactor, Math.min(zoomFactor, maxZoomFactor));

        mouseZoomOffsetX = mouseX - worldX * zoomFactor;
        mouseZoomOffsetY = mouseY - worldY * zoomFactor;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(zoomFactor, 0, 0, zoomFactor, mouseZoomOffsetX, mouseZoomOffsetY); // Apply zoom transformation
        ctx.drawImage(offscreenCanvas, 0, 0);  // Draw offscreen content onto the main canvas
    });

    // Panning Feature
    canvas.addEventListener('mousedown', (event) => {
        isPanning = true; // Start panning
        startX = event.clientX; // Track starting mouse position
        startY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isPanning) return; // Only pan if mouse is pressed

        // Calculate the mouse movement (delta)
        const deltaX = (event.clientX - startX) / zoomFactor; // Scale movement by zoom
        const deltaY = (event.clientY - startY) / zoomFactor;

        // Update offsets based on mouse movement
        mouseZoomOffsetX += deltaX;
        mouseZoomOffsetY += deltaY;

        // Update start position for next frame
        startX = event.clientX;
        startY = event.clientY;

        // Redraw with updated offsets
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(zoomFactor, 0, 0, zoomFactor, mouseZoomOffsetX, mouseZoomOffsetY);
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