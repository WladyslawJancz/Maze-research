from typing import List
from .layout import create_layout
from .default_config import PLAYER_STEPS_PER_SECOND_OPTIONS
from .callbacks import register_callbacks
from dash import Dash


class Player:
    def __init__(
        self,
        app: Dash,
        id_prefix: str,
        speed_presets: List[int] = PLAYER_STEPS_PER_SECOND_OPTIONS,
    ):
        """_summary_

        Args:
            app (Dash): a Dash app object, used for callback context
            id_prefix (str): a prefix added to IDs of all UI elements of the player for easier targeting in callbacks
            speed_presets (List[int], optional): a list of integers added as options for playthrough speed. Defaults to PLAYER_STEPS_PER_SECOND_OPTIONS.
        """
        self.app = app
        self.id_prefix = id_prefix
        self.layout = create_layout(id_prefix, speed_presets)
        register_callbacks(app, id_prefix)

    def render(self):
        return self.layout
