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
    const cellSize = Math.ceil(canvas.width / ((cols - 1) / 2));
    canvas.width = cellSize * ((cols - 1) / 2);
    canvas.height = cellSize * ((rows - 1) / 2);

    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    // Draw labyrinth offscreen, then redraw on the main canvas
    window.drawLabyrinthOffscreen(cellSize, rows, cols, offscreenCtx, labyrinthData);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(offscreenCanvas, 0, 0);  // Draw offscreen content onto the main canvas

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;