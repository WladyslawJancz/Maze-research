// Callback initializing canvas manager
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackManageLabyrinth: function(data, generate_step_by_step) {
            console.time('json_parsing');
            const labyrinthData = JSON.parse(data);  // Decode the JSON data
            console.timeEnd('json_parsing');
            window.initializeCanvasManager("labyrinth-canvas", labyrinthData, generate_step_by_step);  // Call drawing function
            return null;
        }
    })
});

// Callback dispatching event that triggers maze redraw when new color is picked in inputs or maze data is updated
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackUpdateLabyrinthStyle: function(_, wall_color, path_color) {
                console.log('Style callback fired');
                const event = new CustomEvent('mazeStyleUpdated');
                event.value = {"wallStroke": wall_color, "pathFill": path_color};
                window.dispatchEvent(event);
        }
    })
});

// Callback dispatching event that changes maze generation animation speed
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackChangeMazeGenerationAnimationSpeed: function(desired_speed_index, speed_presets) {
                console.log('Maze generation animation speed change callback fired');
                const event = new CustomEvent('mazeGenerationAnimationSpeedUpdated');

                const desiredSpeed = speed_presets[desired_speed_index];
                const interval = Math.max(4, 1000/desiredSpeed);
                const batch = desiredSpeed/(1000/interval)

                event.value = {"intervalDuration": interval, "batchSteps": batch};
                window.dispatchEvent(event);
        }
    })
});