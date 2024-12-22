// Define the clientside callback using Object.assign to avoid overwriting other namespaces
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