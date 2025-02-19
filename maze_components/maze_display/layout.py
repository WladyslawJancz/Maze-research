from typing import TYPE_CHECKING
import dash_mantine_components as dmc
from dash import dcc, html

if TYPE_CHECKING:
    from .maze_display import MazeDisplay


def create_layout(maze_display: "MazeDisplay") -> dmc.Group:
    """Creates MazeDisplay layout

    Args:
        maze_display (MazeDisplay): a MazeDisplay object, contains all relevant information for the layout.

    Returns:
        dmc.Group: A dmc.Group containing all MazeDisplay UI elements - canvas, controls, player.
    """
    canvas_layout = html.Div(
        id=maze_display.canvas_wrapper_id,
        children=[
            dcc.Store(id=maze_display.maze_data_store_id),
            html.Canvas(
                id=maze_display.canvas_id,
                children=[],
                style={
                    "height": "100%",
                    "width": "100%",
                    "margin": "auto",
                },
            ),
        ],
        style={
            "display": "flex",
            "align-content": "center",
            "height": "100%",
            "boxSizing": "border-box",
            "margin": "auto",
            "overflow": "hidden",
            "flex": 5,
            "background": "#FFFFFF",
        },
    )

    controls_layout = maze_display.controls.render()
    player_layout = maze_display.player.render()

    maze_display_layout = dmc.Group(
        id=maze_display.main_id,
        children=[canvas_layout, dmc.Stack(children=[controls_layout, player_layout])],
        h="100%",
    )

    return maze_display_layout
