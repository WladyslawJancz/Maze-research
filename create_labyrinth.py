from dash import html, callback, clientside_callback, ClientsideFunction, Input, Output, State, dcc
import dash_mantine_components as dmc
import json

import random
import time

from maze_generators.depth_first_search_generator import generate_dfs_labyrinth

def create_labyrinth():
    labyrinth = html.Div(
        id='labyrinth',
        children=[
            dcc.Store(id="labyrinth-data-store"),
            html.Canvas(
                id='labyrinth-canvas',
                children=[],
                style={
                    'height':'100%',
                    'aspectRatio':1,
                    'margin':'auto'
                }
            )
        ],
        style={
            'display':'flex',
            'align-content':'center',
            'height':'100%',
            'boxSizing':'border-box',
            'margin':'auto',
            'overflow':'hidden',
            'flex':5
        }
    )
    labyrinth_controls = dmc.Stack(
        id='labyrinth-controls',
        children=[
            dmc.Slider(
                id='maze-size-slider',
                value=10,
                min=1,
                max=500,
                labelAlwaysOn=True,
                persistence=True
            ),
            dmc.Button(
                id='generate-maze-button',
                children=['Generate']
                
            )
        ],
        flex=1
    )
    return dmc.Group(children=[labyrinth, labyrinth_controls], h='100%')

# Callback to generate labyrinth data dynamically
@callback(
    Output("labyrinth-data-store", "data"),  # Send generated labyrinth data to Store
    Output("content-placeholder", "children"),
    Input("generate-maze-button", "n_clicks"),       # Triggered on button click
    State("maze-size-slider", "value")
)
def generate_dfs_labyrinth_on_refresh(n_clicks, side_size):
    labyrinth_data = generate_dfs_labyrinth(side_size)

    json_time = time.time()
    labyrinth_data = json.dumps(labyrinth_data)
    json_time = time.time() - json_time
    print(f"\n json time: {json_time}")
    
    return labyrinth_data, side_size  # Send as JSON

clientside_callback(
    ClientsideFunction(
        namespace='namespace',
        function_name='callbackManageLabyrinth'
    ),

    Input("labyrinth-data-store", "data")
)