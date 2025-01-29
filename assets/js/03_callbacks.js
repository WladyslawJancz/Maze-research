// Callback initializing canvas manager
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackManageLabyrinth: function(data) {
            console.time('json_parsing');
            const labyrinthData = JSON.parse(data);  // Decode the JSON data
            console.timeEnd('json_parsing');
            window.initializeCanvasManager("labyrinth-canvas", labyrinthData);  // Call drawing function
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