// Callback initializing canvas manager
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackManageLabyrinth: function(data, canvas_id) {
            console.time('json_parsing');
            const labyrinthData = JSON.parse(data);  // Decode the JSON data
            console.timeEnd('json_parsing');
            window.initializeCanvasManager(canvas_id, labyrinthData);  // Call drawing function
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

// Callback dispatching event that changes maze generation animation speed
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackPlayerPlayPause: function(button_n_clicks) {
                console.log('Player play-pause callback fired');
                let action = null;

                if (button_n_clicks % 2 === 0) {
                    action = "Pause"
                } else if (button_n_clicks % 2 === 1) {
                    action = "Play"
                }
                console.log("Action", action)
                const event = new CustomEvent('playerPlayPause');
                event.value = action;
                window.dispatchEvent(event);
        }
    })
});

// Callback dispatching event that changes canvas behavious depending on player visibility
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackPlayerVisibilityChange: function(button_n_clicks) {
                console.log('Player show-hide callback fired');
                let playerState = null;

                if (button_n_clicks % 2 === 0) {
                    playerState = "hidden"
                } else if (button_n_clicks % 2 === 1) {
                    playerState = "visible"
                }
                console.log("Player state", playerState)
                const event = new CustomEvent('playerVisibilityChange');
                event.value = playerState;
                window.dispatchEvent(event);
        }
    })
});
