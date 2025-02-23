from typing import TYPE_CHECKING
import dash_mantine_components as dmc
from dash import dcc

if TYPE_CHECKING:
    from .controls import Controls


def create_layout(controls: "Controls") -> dmc.Stack:
    """Creates Controls layout

    Args:
        controls (Controls): a Controls object, contains all relevant information for the layout.

    Returns:
        dmc.Stack: A dmc.Stack containing all Controls UI elements - buttons, sliderds, etc.
    """
    layout = dmc.Stack(
        id=controls.main_id,
        children=[
            dmc.Group(
                children=[
                    dmc.Stack(
                        children=[
                            dmc.ColorInput(
                                id=controls.wall_color_picker_id,
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
                                id=controls.floor_color_picker_id,
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
                        id=controls.square_mode_checkbox_id,
                        checked=False,
                        label="Render square maze",
                        persistence=True,
                    ),
                    dmc.Group(
                        children=[
                            dmc.Text("Maze width", w=90),
                            dmc.Slider(
                                id=controls.width_slider_id,
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
                                id=controls.height_slider_id,
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
            dmc.Group(
                children=[
                    dmc.Button(
                        id=controls.generate_button_id, children=["Generate"], flex=1
                    ),
                ],
            ),
        ],
        gap=60,
        flex=1,
    )

    return layout
