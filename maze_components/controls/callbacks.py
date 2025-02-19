from dash import ClientsideFunction, Input, Output, Dash
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .controls import Controls


def register_callbacks(app: Dash, controls: "Controls"):
    """Registers Controls callbacks in the app.

    Args:
        dash (Dash): A Dash application object.
        controls (Controls): A Controls object, whose elements are used as callback inputs/outputs.
    """

    # Callback to disable maze height slider if square mode is enabled
    @app.callback(
        Output(controls.height_slider_id, "disabled"),
        Input(controls.square_mode_checkbox_id, "checked"),
    )
    def handle_square_mode(square_mode_enabled):
        if square_mode_enabled:
            height_slider_disabled = True
        else:
            height_slider_disabled = False
        return height_slider_disabled
