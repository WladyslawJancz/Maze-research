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
            dcc.Store(id='maze-style-store', storage_type='local'),
            html.Canvas(
                id='labyrinth-canvas',
                children=[],
                style={
                    'height':'100%',
                    'width': '100%',
                    'margin':'auto',
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
            'flex':5,
            'background': '#FFFFFF'
        }
    )
    labyrinth_controls = dmc.Stack(
        id='labyrinth-controls',
        children=[
            dmc.Group(
                children=[
                    dmc.ColorPicker(
                        id='maze-wall-color-picker',
                        format='hex',
                        value='#63C5DA',
                        fullWidth=True,
                        persistence=True
                    ),
                    dmc.ColorPicker(
                        id='maze-path-color-picker',
                        format='hex',
                        value='#FFFFFF',
                        fullWidth=True,
                        persistence=True
                    ),
                ],
                wrap='nowrap',
            ),
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

# Callback to update maze style information in dcc.Store
@callback(
    Output("maze-style-store", "data"),
    Input("maze-wall-color-picker", "value"),
    Input("maze-path-color-picker", "value")
)
def update_maze_style_store(wall_color, path_color):
    return {'wallStroke': wall_color, 'pathFill': path_color}

# Callback to dispatch event that triggers maze redraw with new style
clientside_callback( # TODO: decide if style needs to be applied with a button (button input to upload new styles to store) or continuously
    ClientsideFunction(
        namespace='namespace',
        function_name='callbackUpdateLabyrinthStyle'
    ),
    Input("maze-style-store", "data")
)

clientside_callback(
    ClientsideFunction(
        namespace='namespace',
        function_name='callbackManageLabyrinth'
    ),

    Input("labyrinth-data-store", "data")
)