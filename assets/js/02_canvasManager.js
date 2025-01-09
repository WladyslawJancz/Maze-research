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

    // Below 3 variables are needed for maze redraw function when zooming/panning
    let prevOffsetX = null;
    let prevOffsetY = null;
    let prevZoomFactor = null;

    // Minimap variables
    let miniMapX, miniMapY, miniMapWidth, miniMapHeight;
    let minimapTargetOffsetX = null;
    let minimapTargetOffsetY = null;
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

    const cellCountX = ((cols - 1) / 2);
    const cellCountY = ((rows - 1) / 2);

    // Calculate cell size and adjust canvas dimensions
    // Pick smaller cell size to fit a bigger portion of the image
    let cellSize = Math.min(
        (canvas.width * zoomFactor) / cellCountX,
        (canvas.height * zoomFactor) / cellCountY
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
        if (
            prevOffsetX === renderedImageCanvasOffsetX &&
            prevOffsetY === renderedImageCanvasOffsetY &&
            prevZoomFactor === zoomFactor &&
            forceDraw === false
        ) {
            return; // No change — skip rendering
        }

        // console.time('Rendering visible cells:');
        // console.log('Rendering visible cells at zoom: ', zoomFactor);
        // Update cached values to the current ones
        prevOffsetX = renderedImageCanvasOffsetX;
        prevOffsetY = renderedImageCanvasOffsetY;
        prevZoomFactor = zoomFactor;

        cellSize = Math.min(
            (canvas.width * zoomFactor) / cellCountX,
            (canvas.height * zoomFactor) / cellCountY
        ); // shared between main and offscreen

        // using cells indexes (0-based) below, not maze data grid coordinates
        const firstVisibleCellX = Math.max(0, Math.floor(-renderedImageCanvasOffsetX / cellSize));
        const lastVisibleCellX = Math.min(Math.ceil(((canvas.width - renderedImageCanvasOffsetX) / cellSize) -1), cellCountX);
        const firstVisibleCellY = Math.max(0, Math.floor(-renderedImageCanvasOffsetY / cellSize));
        const lastVisibleCellY = Math.min(Math.ceil(((canvas.height - renderedImageCanvasOffsetY) / cellSize) -1), cellCountY);

        // slicing maze data grid/ json array
        const sliceStartX = firstVisibleCellX * 2;
        const sliceEndX = lastVisibleCellX * 2 + 3;
        const sliceStartY = firstVisibleCellY * 2;
        const sliceEndY = lastVisibleCellY * 2 + 3;

        // console.log('Visible cells along X: ', firstVisibleCellX, ' to ', lastVisibleCellX);
        // console.log('Visible cells along Y: ', firstVisibleCellY, ' to ', lastVisibleCellY);
        
        // console.time('json slicing');
        const visibleCellData = labyrinthData.slice(sliceStartY, sliceEndY).map(row => row.slice(sliceStartX, sliceEndX));
        // console.log('Data slice: ', 'y1 = ', sliceStartY, 'y2 = ', sliceEndY, 'x1 = ', sliceStartX, 'x2 = ', sliceEndX);
        // console.timeEnd('json slicing');
        const visibleCellOffsetX = (renderedImageCanvasOffsetX >= 0) ? renderedImageCanvasOffsetX : renderedImageCanvasOffsetX % cellSize;
        const visibleCellOffsetY = (renderedImageCanvasOffsetY >= 0) ? renderedImageCanvasOffsetY : renderedImageCanvasOffsetY % cellSize;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        offscreenCtx.clearRect(0,0,offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.setTransform(1, 0, 0, 1, visibleCellOffsetX, visibleCellOffsetY);
        window.drawLabyrinthOffscreen(cellSize, visibleCellData.length, visibleCellData[0].length, offscreenCtx, visibleCellData, zoomFactor, mazeStyle);
        ctx.drawImage(offscreenCanvas, 0, 0);
        
        // Mini-map dimensions ( max 10% of canvas along smaller dimension)
        const miniMapSizeFactor = Math.max(
            (cellCountX * cellSize) / (canvas.width * 0.1),
            (cellCountY * cellSize) / (canvas.height * 0.1)
        );
        miniMapWidth = cellCountX * cellSize / miniMapSizeFactor;
        miniMapHeight = cellCountY * cellSize / miniMapSizeFactor;

        // Mini-map position (bottom-right corner)
        miniMapX = canvas.width - miniMapWidth - 10;
        miniMapY = canvas.height - miniMapHeight - 30; // Above zoom info

        // Scale factors for mini-map
        const scaleX = miniMapWidth / cellCountX;
        const scaleY = miniMapHeight / cellCountY;

        // Draw mini-map background
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)'; // Light gray background
        ctx.fillRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Border
        ctx.strokeRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

        // Calculate viewport position inside mini-map
        const viewX = miniMapX + (-renderedImageCanvasOffsetX / cellSize) * scaleX;
        const viewY = miniMapY + (-renderedImageCanvasOffsetY / cellSize) * scaleY;
        const viewWidth = (canvas.width / cellSize) * scaleX;
        const viewHeight = (canvas.height / cellSize) * scaleY;

        // Draw viewport rectangle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white
        ctx.fillRect(viewX, viewY, viewWidth, viewHeight);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Border
        ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);

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


        // console.timeEnd('Rendering visible cells:');

    };

    // Main animation loop
    function renderLoop() {
        if (!isPanning && !isZooming) {
            compensatePanning(); // Only compensate when no panning or zooming is happening


            if (isMinimapAnimating) {
                
                // Handle minimap animation first
                renderedImageCanvasOffsetX = lerp(renderedImageCanvasOffsetX, minimapTargetOffsetX, animationSpeed);
                renderedImageCanvasOffsetY = lerp(renderedImageCanvasOffsetY, minimapTargetOffsetY, animationSpeed);
                drawVisibleCells(); // Redraw during minimap animation
    
                // Stop minimap animation if close enough
                if (
                    Math.abs(renderedImageCanvasOffsetX - minimapTargetOffsetX) <= 0.5 &&
                    Math.abs(renderedImageCanvasOffsetY - minimapTargetOffsetY) <= 0.5
                ) {
                    renderedImageCanvasOffsetX = minimapTargetOffsetX; // Snap to target
                    renderedImageCanvasOffsetY = minimapTargetOffsetY;
                    isMinimapAnimating = false; // End minimap animation
                }
            } else if (
                // If minimap is not animating and compensation is needed
                Math.abs(renderedImageCanvasOffsetX - compensatePanningOffsetX) > 0.5 ||
                Math.abs(renderedImageCanvasOffsetY - compensatePanningOffsetY) > 0.5
            ) {
                renderedImageCanvasOffsetX = lerp(renderedImageCanvasOffsetX, compensatePanningOffsetX, animationSpeed);
                renderedImageCanvasOffsetY = lerp(renderedImageCanvasOffsetY, compensatePanningOffsetY, animationSpeed);
                // Redraw with updated offsets
                drawVisibleCells();
                if (
                    Math.abs(renderedImageCanvasOffsetX - compensatePanningOffsetX) <= 0.5 &&
                    Math.abs(renderedImageCanvasOffsetY - compensatePanningOffsetY) <= 0.5
                ) {
                    renderedImageCanvasOffsetX = compensatePanningOffsetX; // Snap to target
                    renderedImageCanvasOffsetY = compensatePanningOffsetY;
                }
            }
        }
        requestAnimationFrame(renderLoop); // Keep the loop running
    };

    //Function to automatically move (translate) canvas to avoid whitespace on screen
    function compensatePanning() {
        if (isPanning || isZooming) return;

        compensatePanningOffsetX = renderedImageCanvasOffsetX;
        compensatePanningOffsetY = renderedImageCanvasOffsetY;

        const mazeWidth = cellCountX * cellSize;
        const mazeHeight = cellCountY * cellSize;
        // center image if image is smaller then canvas,
        // align left or right border if margin is visible only from left or right
        if (mazeWidth < canvas.width) {
            compensatePanningOffsetX = (canvas.width - mazeWidth) / 2;
        } else if (mazeWidth >= canvas.width && renderedImageCanvasOffsetX > 0) {
            compensatePanningOffsetX = 0;
        } else if (mazeWidth >= canvas.width && -renderedImageCanvasOffsetX > mazeWidth - canvas.width) {
            compensatePanningOffsetX = -(mazeWidth - canvas.width);
        }

        if (mazeHeight < canvas.height) {
            compensatePanningOffsetY = (canvas.height - mazeHeight) / 2;
        } else if (mazeHeight >= canvas.height && renderedImageCanvasOffsetY > 0) {
            compensatePanningOffsetY = 0;
        } else if (mazeHeight >= canvas.height && -renderedImageCanvasOffsetY > mazeHeight - canvas.height) {
            compensatePanningOffsetY = -(mazeHeight - canvas.height);
        }
    };
    
    // Zoom feature
    canvas.addEventListener('wheel', (event) => {
        isMinimapAnimating = false; // Cancel minimap animation
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
        isMinimapAnimating = false; // Cancel minimap animation
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

    // Click-to-move support for mini-map
    canvas.addEventListener('click', (e) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        // Check if the click is inside the mini-map bounds
        if (
            mouseX >= miniMapX &&
            mouseX <= miniMapX + miniMapWidth &&
            mouseY >= miniMapY &&
            mouseY <= miniMapY + miniMapHeight
        ) {
            // Calculate the relative position inside the mini-map
            const scaleX = miniMapWidth / cellCountX;
            const scaleY = miniMapHeight / cellCountY;

            // Calculate the corresponding coordinates in the main canvas
            const targetX = (mouseX - miniMapX) / scaleX; // Corresponding X in the main maze
            const targetY = (mouseY - miniMapY) / scaleY; // Corresponding Y in the main maze

            // Update the offsets to center the viewport on the clicked position
            // Ensure the center of the clicked position on the mini-map corresponds to the center on the full canvas
            minimapTargetOffsetX = -(targetX * cellSize) + canvas.width / 2;
            minimapTargetOffsetY = -(targetY * cellSize) + canvas.height / 2;

            // Clamp the offsets to avoid scrolling out of bounds
            minimapTargetOffsetX = Math.min(0, Math.max(minimapTargetOffsetX, -cellCountX * cellSize + canvas.width));
            minimapTargetOffsetY = Math.min(0, Math.max(minimapTargetOffsetY, -cellCountY * cellSize + canvas.height));

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
    renderedImageCanvasOffsetX = compensatePanningOffsetX;
    renderedImageCanvasOffsetY = compensatePanningOffsetY;

    // Main script - draw offscreen maze, draw the same image on main canvas, listen for pan or zoom events, animate
    drawVisibleCells();
    // Start the loop
    renderLoop();

};

// Export the function to make it accessible
window.initializeCanvasManager = initializeCanvasManager;