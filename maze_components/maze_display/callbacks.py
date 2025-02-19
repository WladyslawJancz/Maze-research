import json
import time
from dash import ClientsideFunction, Input, Output, State, Dash
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .maze_display import MazeDisplay


def register_callbacks(app: Dash, maze_display: "MazeDisplay"):
    """Registers MazeDisplay callbacks in the app.

    Args:
        dash (Dash): A Dash application object.
        maze_display (MazeDisplay): A MazeDisplay object, whose elements are used as callback inputs/outputs.
    """

    # Callback to generate labyrinth data dynamically
    @app.callback(
        Output(
            maze_display.maze_data_store_id, "data"
        ),  # Send generated labyrinth data to Store
        Output(maze_display.player.step_slider_id, "max"),
        Input(
            maze_display.controls.generate_button_id, "n_clicks"
        ),  # Triggered on button click
        State(maze_display.controls.width_slider_id, "value"),
        State(maze_display.controls.height_slider_id, "value"),
        State(maze_display.controls.square_mode_checkbox_id, "checked"),
    )
    def generate_maze(n_clicks, maze_width, maze_height, square_mode_enabled):
        if square_mode_enabled:
            maze_height = maze_width
        labyrinth_data = maze_display.maze_generator_fn(maze_width, maze_height)
        num_steps = len(labyrinth_data[1])

        # labyrinth_data = generate_random_grid(maze_width, maze_height)

        json_time = time.time()
        labyrinth_data = json.dumps(labyrinth_data)
        json_time = time.time() - json_time
        print(f"\n json time: {json_time}")

        return (
            labyrinth_data,
            # "Maze dimensions: {} x {}".format(maze_width, maze_height),
            num_steps,
        )  # Send as JSON

    # Callback to initialize canvas manager for the maze,
    # triggered when maze data is available after "Generate" button press
    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace", function_name="callbackManageLabyrinth"
        ),
        Input(maze_display.maze_data_store_id, "data"),
        State(maze_display.canvas_id, "id"),
        State(maze_display.controls.show_player_on_start_checkbox_id, "checked"),
    )

    # Callback to dispatch event that triggers maze redraw with new style on style update or new maze creation
    app.clientside_callback(
        ClientsideFunction(
            namespace="namespace", function_name="callbackUpdateLabyrinthStyle"
        ),
        Input(maze_display.maze_data_store_id, "data"),
        Input(maze_display.controls.wall_color_picker_id, "value"),
        Input(maze_display.controls.floor_color_picker_id, "value"),
    )
