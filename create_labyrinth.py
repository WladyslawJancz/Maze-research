from pydoc import doc
from typing import Callable, List, Optional
from maze_components.maze_display.maze_display import MazeDisplay
from dash import Dash
import dash_mantine_components as dmc


def create_labyrinth(
    app: Dash,
    name: str,
    maze_generator_fn: Callable[[int, Optional[int]], List[List]],
) -> dmc.Group:
    maze_display = MazeDisplay(app, name, maze_generator_fn)
    maze_layout = maze_display.render()
    maze_display.setup_callbacks()

    return maze_layout
