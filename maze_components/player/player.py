from typing import List
from .layout import create_layout
from .default_config import PLAYER_STEPS_PER_SECOND_OPTIONS
from .callbacks import register_callbacks
from maze_components.utils import create_id
from dash import Dash


class Player:
    def __init__(
        self,
        app: Dash,
        id_prefix: str,
        speed_presets: List[int] = PLAYER_STEPS_PER_SECOND_OPTIONS,
    ):
        """Player component

        Args:
            app (Dash): a Dash app object, used for callback context
            id_prefix (str): a prefix added to IDs of all UI elements of the Player for easier targeting in callbacks
            speed_presets (List[int], optional): a list of integers added as options for playthrough speed. Defaults to PLAYER_STEPS_PER_SECOND_OPTIONS.
        """
        self.app = app
        self.id_prefix = id_prefix
        self.speed_presets = speed_presets

        self.main_id = create_id(id_prefix, "main")
        self.main_state_store_id = create_id(id_prefix, "main-state-store")
        self.speed_presets_store_id = create_id(id_prefix, "speed-presets-store")
        self.step_slider_id = create_id(id_prefix, "step-slider")
        self.speed_slider_id = create_id(id_prefix, "speed-slider")

        self.layout = create_layout(self)

    def render(self):
        """Render Player in the app

        Returns:
            dmc.Stack: Player layout
        """
        return self.layout

    def setup_callbacks(self):
        """Registers Player callbacks in the app"""
        register_callbacks(self.app, self)
