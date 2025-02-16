from typing import List
import dash_mantine_components as dmc
from dash import dcc

from .utils import prefix_id


def create_layout(id_prefix: str, speed_presets: List[int]) -> dmc.Stack:
    """Creates Player layout

    Args:
        id_prefix (str): a string attached to IDs of all UI elements of a player for easy identification in callbacks
        speed_presets (List[int]): a list of integers representing available options for "steps per second" slider. Controls animation speed.

    Returns:
        dmc.Stack: A dmc.Stack containing all player UI elements - buttons, sliderds, etc.
    """
    layout = dmc.Stack(
        children=[
            dcc.Store(
                id=prefix_id(id_prefix, "speed-presets-store"),
                data=speed_presets,
            ),
            dmc.Group(
                children=[dmc.Button() for i in range(5)],
                justify="center",
                wrap="nowrap",
            ),
            dmc.Slider(  # player position
                id=prefix_id(id_prefix, "step-slider"),
                min=0,
                max=3000000,
                step=1,
                value=2,
                updatemode="mouseup",
            ),
            dmc.Slider(  # player speed
                id=prefix_id(id_prefix, "speed-slider"),
                marks=[
                    {
                        "value": value,
                        "label": f"{str(int(label/1000))+"K" if label >= 1000 else label}",
                    }
                    for value, label in enumerate(speed_presets)
                ],
                label=None,  # lambda value: str(speed_presets[value]), # Should be available in a future release
                min=0,
                max=len(speed_presets) - 1,
                restrictToMarks=True,
                value=2,
                updatemode="drag",
            ),
        ]
    )

    return layout
