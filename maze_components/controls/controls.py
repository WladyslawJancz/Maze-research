from dash import Dash
from maze_components.utils import create_id
from .layout import create_layout
from .callbacks import register_callbacks


class Controls:
    def __init__(
        self,
        app: Dash,
        id_prefix: str,
    ):
        """Controls component

        Args:
            app (Dash): a Dash app object, used for callback context
            id_prefix (str): a prefix added to IDs of all UI elements of Controls for easier targeting in callbacks
        """
        self.app = app
        self.id_prefix = id_prefix

        self.main_id = create_id(id_prefix, "main")
        self.wall_color_picker_id = create_id(id_prefix, "wall-color-picker")
        self.floor_color_picker_id = create_id(id_prefix, "floor-color-picker")
        self.square_mode_checkbox_id = create_id(id_prefix, "square-mode-checkbox")
        self.width_slider_id = create_id(id_prefix, "width-slider")
        self.height_slider_id = create_id(id_prefix, "height-slider")
        self.generate_button_id = create_id(id_prefix, "generate_button")
        self.show_player_on_start_checkbox_id = create_id(
            id_prefix, "show-player-on-start-checkbox"
        )

        self.layout = create_layout(self)

    def render(self):
        """Render Controls in the app

        Returns:
            dmc.Stack: Controls layout
        """
        return self.layout

    def setup_callbacks(self):
        """Registers Controls callbacks in the app"""
        register_callbacks(self.app, self)
