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

// Callback dispatching event that triggers maze redraw when local storage is updated
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    namespace: Object.assign({}, (window.dash_clientside || {}).namespace, {
        callbackUpdateLabyrinthStyle: function(mazeStyle) {
                console.log('Style callback fired');
                const event = new CustomEvent('mazeStyleUpdated');
                event.value = mazeStyle;
                window.dispatchEvent(event);
        }
    })
});