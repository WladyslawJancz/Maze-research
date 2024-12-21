from dash import html, callback, clientside_callback, ClientsideFunction, Input, Output
import json

import random
import time

from maze_generators.depth_first_search_generator import generate_dfs_labyrinth

def create_labyrinth():
    labyrinth = html.Div(
        id='labyrinth',
        children=[
            html.Div(id="labyrinth-data", style={"display": "none"}, children=[]), #json.dumps(labyrinth_data)),
            html.Div(id='dummy',children=[],style={"display": "none"}),
            html.Canvas(
                id='labyrinth-canvas',
                children=[],
                style={
                    'width':'100%',
                    'height':'100%'
                }
            )
        ],
        style={
            'background': '#FFFFFF',
            'max-height':'100%',
            'max-width':'100%',
            'aspect-ratio':'1',
            'box-sizing':'border-box',
            'border':'1px solid #000000',
            'margin':'auto'
            # 'flex':1,
            # 'overflow':'hidden'
        }
    )
    return labyrinth

# Callback to generate labyrinth data dynamically
@callback(
    Output("labyrinth-data", "children"),  # Send generated labyrinth data to this Div
    Output("content-placeholder", "children"),
    Input("labyrinth-canvas", "id")       # Triggered on page load
)
def generate_dfs_labyrinth_on_refresh(_):
    side_size = random.choice(range(50, 61))  # Define labyrinth size
    labyrinth_data = generate_dfs_labyrinth(side_size)

    json_time = time.time()
    labyrinth_data = json.dumps(labyrinth_data)
    json_time = time.time() - json_time
    print(f"\n json time: {json_time}")
    
    return labyrinth_data, side_size  # Send as JSON

clientside_callback(
    ClientsideFunction(
        namespace='namespace',
        function_name='drawLabyrinth'
    ),
    Output("dummy", "children"),
    Input("labyrinth-data", "children")
)