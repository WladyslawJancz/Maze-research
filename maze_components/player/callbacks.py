from dash import ClientsideFunction, Input, Output, State, Dash
from typing import TYPE_CHECKING
from dash_iconify import DashIconify

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

    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace", function_name="callbackPlayerPlayPause"
        ),
        Input(player.button_play_id, "n_clicks"),
    )

    @app.callback(
        Output(player.button_play_id, "children"),
        Input(player.button_play_id, "n_clicks"),
    )
    def player_play_pause_change_icon(n_clicks):
        if n_clicks % 2 == 0:
            return DashIconify(icon="mdi:play", height=24)
        if n_clicks % 2 != 0:
            return DashIconify(icon="mdi:pause", height=24)

    # Handle player visibility - client and server side
    @app.callback(
        Output(player.player_body_id, "display"),
        Output(player.button_play_id, "n_clicks"),
        Input(player.show_hide_button_id, "n_clicks"),
    )
    def show_hide_player(show_hide_n_clicks):
        play_button_state = 0
        if show_hide_n_clicks == 1:
            play_button_state = 1
        if show_hide_n_clicks % 2 == 0:
            return "none", 0
        if show_hide_n_clicks % 2 == 1:
            return "flex", play_button_state

    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace", function_name="callbackPlayerVisibilityChange"
        ),
        Input(player.show_hide_button_id, "n_clicks"),
    )
