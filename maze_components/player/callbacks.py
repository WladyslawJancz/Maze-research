from dash import clientside_callback, ClientsideFunction, Input, State, Dash
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .player import Player


def register_callbacks(app: Dash, player: "Player"):
    """Registers Player callbacks in the app.

    Args:
        dash (Dash): A Dash application object.
        player (Player): A Player object, whose elements are used as callback inputs/outputs.
    """
    # Callback to dispatch event that changes maze generation animation speed
    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace",
            function_name="callbackChangeMazeGenerationAnimationSpeed",
        ),
        Input(player.speed_slider_id, "value"),
        State(player.speed_presets_store_id, "data"),
    )
