from typing import Callable, List, Optional
from dash import Dash
from maze_components.utils import create_id
from .callbacks import register_callbacks
from .layout import create_layout

from maze_components.controls import Controls
from maze_components.player import Player


class MazeDisplay:
    def __init__(
        self,
        app: Dash,
        id_prefix: str,
        maze_generator_fn: Callable[[int, Optional[int]], List[List]],
    ):
        """MazeDisplay component. Contains canvas for rendering controls (generation parameters, style) and player

        Args:
            app (Dash): a Dash app object, used for callback context
            id_prefix (str): a prefix added to IDs of all UI elements of the MazeDisplay for easier targeting in callbacks

        """
        self.app = app
        self.id_prefix = id_prefix
        self.maze_generator_fn = maze_generator_fn

        self.main_id = create_id(id_prefix, "maze-display")
        self.canvas_wrapper_id = create_id(id_prefix, "canvas-wrapper")
        self.canvas_id = create_id(id_prefix, "canvas")
        self.maze_data_store_id = create_id(id_prefix, "maze-data-store")

        self.controls_id = create_id(id_prefix, "controls")
        self.player_id = create_id(id_prefix, "player")

        self.controls = Controls(app, self.controls_id)
        self.player = Player(app, self.player_id)

        self.layout = create_layout(self)

    def render(self):
        """Render MazeDisplay in the app

        Returns:
            dmc.Stack: MazeDisplay layout
        """
        return self.layout

    def setup_callbacks(self):
        """Registers MazeDisplay callbacks in the app"""
        register_callbacks(self.app, self)
        self.controls.setup_callbacks()
        self.player.setup_callbacks()
