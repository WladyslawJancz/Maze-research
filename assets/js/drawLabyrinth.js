// Define the drawing logic globally
function drawLabyrinth(canvasId, labyrinthData) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // // Dynamically set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");

    console.log(ctx.MAX_VERTEX_UNIFORM_VECTORS);
    console.log(ctx.MAX_TEXTURE_SIZE);

    const rows = labyrinthData.length;
    const cols = labyrinthData[0].length;

    // Calculate integer cell size and adjust canvas dimensions
    const cellSize = Math.ceil(canvas.width / cols);
    canvas.width = cellSize * cols;
    canvas.height = cellSize * rows;

    // Disable anti-aliasing (optional)
    ctx.imageSmoothingEnabled = false;

    // Draw the labyrinth grid
    // for (let y = 0; y < rows; y++) {
    //     for (let x = 0; x < cols; x++) {
    //         ctx.fillStyle = labyrinthData[y][x] === 1 ? "#daa520" : "white";
    //         ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    //     }
    // }

    ctx.beginPath();
    let batchSize = 10000; // Draw in chunks of 10,000 cells
    let count = 0;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labyrinthData[y][x] === 1) {
                ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                count++;
                if (count >= batchSize) {
                    ctx.fillStyle = "#daa520";
                    ctx.fill();
                    ctx.beginPath(); // Start a new batch
                    count = 0;
                }
            }
        }
    }
    // Final fill for remaining cells
    ctx.fillStyle = "#daa520";
    ctx.fill();


    count = 0;
    ctx.beginPath();
   
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labyrinthData[y][x] === 0) {
                ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                count++;
                if (count >= batchSize) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fill();
                    ctx.beginPath(); // Start a new batch
                    count = 0;
                }
            }
        }
    }
    // Final fill for remaining cells
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    }


// Define the clientside callback using Object.assign to avoid overwriting other namespaces
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        drawLabyrinth: function(data) {
            const labyrinthData = JSON.parse(data);  // Decode the JSON data
            drawLabyrinth("labyrinth-canvas", labyrinthData);  // Call your drawing function
            return null;
        }
    })
});
