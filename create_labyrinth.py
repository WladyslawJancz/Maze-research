from dash import (
    html,
    callback,
    clientside_callback,
    ClientsideFunction,
    Input,
    Output,
    State,
    dcc,
)
import dash_mantine_components as dmc
import json

import random
import time

from maze_generators.depth_first_search_generator import generate_dfs_labyrinth
from maze_generators.random_grid_generator import generate_random_grid


def create_labyrinth():
    labyrinth = html.Div(
        id="labyrinth",
        children=[
            dcc.Store(id="labyrinth-data-store"),
            dcc.Store(id="maze-style-store", storage_type="local"),
            html.Canvas(
                id="labyrinth-canvas",
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
    labyrinth_controls = dmc.Stack(
        id="labyrinth-controls",
        children=[
            dmc.Group(
                children=[
                    dmc.Stack(
                        children=[
                            dmc.ColorInput(
                                id="maze-wall-color-picker",
                                format="hex",
                                value="#63C5DA",
                                label="Wall color",
                                persistence=True,
                            ),
                        ],
                        gap=5,
                        flex=1,
                    ),
                    dmc.Stack(
                        children=[
                            dmc.ColorInput(
                                id="maze-path-color-picker",
                                format="hex",
                                value="#FFFFFF",
                                label="Floor color",
                                persistence=True,
                            ),
                        ],
                        gap=5,
                        flex=1,
                    ),
                ],
                wrap="nowrap",
            ),
            dmc.Stack(
                children=[
                    dmc.Checkbox(
                        id="maze-square-mode-checkbox",
                        checked=False,
                        label="Render square maze",
                        persistence=True,
                    ),
                    dmc.Group(
                        children=[
                            dmc.Text("Maze width", w=90),
                            dmc.Slider(
                                id="maze-width-slider",
                                value=10,
                                min=5,
                                max=500,
                                step=5,
                                labelAlwaysOn=False,
                                persistence=True,
                                flex=4,
                            ),
                        ]
                    ),
                    dmc.Group(
                        children=[
                            dmc.Text("Maze height", w=90),
                            dmc.Slider(
                                id="maze-height-slider",
                                value=10,
                                min=5,
                                max=500,
                                step=5,
                                labelAlwaysOn=False,
                                persistence=True,
                                flex=1,
                            ),
                        ]
                    ),
                ]
            ),
            dmc.Button(id="generate-maze-button", children=["Generate"]),
        ],
        gap=60,
        flex=1,
    )
    return dmc.Group(children=[labyrinth, labyrinth_controls], h="100%")


# Callback to generate labyrinth data dynamically
@callback(
    Output("labyrinth-data-store", "data"),  # Send generated labyrinth data to Store
    Output("content-placeholder", "children"),
    Input("generate-maze-button", "n_clicks"),  # Triggered on button click
    State("maze-width-slider", "value"),
    State("maze-height-slider", "value"),
    State("maze-square-mode-checkbox", "checked"),
)
def generate_dfs_labyrinth_on_refresh(
    n_clicks, maze_width, maze_height, square_mode_enabled
):
    if square_mode_enabled:
        maze_height = maze_width
    labyrinth_data = generate_dfs_labyrinth(maze_width, maze_height)
    # labyrinth_data = generate_random_grid(maze_width, maze_height)

    json_time = time.time()
    labyrinth_data = json.dumps(labyrinth_data)
    json_time = time.time() - json_time
    print(f"\n json time: {json_time}")

    return labyrinth_data, "Maze dimensions: {} x {}".format(
        maze_width, maze_height
    )  # Send as JSON


# Callback to update maze style information in dcc.Store
@callback(
    Output("maze-style-store", "data"),
    Input("maze-wall-color-picker", "value"),
    Input("maze-path-color-picker", "value"),
)
def update_maze_style_store(wall_color, path_color):
    return {"wallStroke": wall_color, "pathFill": path_color}


# Callback to dispatch event that triggers maze redraw with new style
clientside_callback(  # TODO: decide if style needs to be applied with a button (button input to upload new styles to store) or continuously
    ClientsideFunction(
        namespace="namespace", function_name="callbackUpdateLabyrinthStyle"
    ),
    Input("maze-style-store", "data"),
)

clientside_callback(
    ClientsideFunction(namespace="namespace", function_name="callbackManageLabyrinth"),
    Input("labyrinth-data-store", "data"),
)


@callback(
    Output("maze-height-slider", "disabled"),
    Input("maze-square-mode-checkbox", "checked"),
)
def handle_square_mode(square_mode_enabled):
    if square_mode_enabled:
        height_slider_disabled = True
    else:
        height_slider_disabled = False
    return height_slider_disabled
