from dash import clientside_callback, ClientsideFunction, Input, State


def register_callbacks(app, id_prefix):
    # Callback to dispatch event that changes maze generation animation speed
    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace",
            function_name="callbackChangeMazeGenerationAnimationSpeed",
        ),
        Input(f"{id_prefix}-speed-slider", "value"),
        State(f"{id_prefix}-speed-presets-store", "data"),
    )
