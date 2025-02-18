from typing import TYPE_CHECKING
import dash_mantine_components as dmc
from dash import dcc

if TYPE_CHECKING:
    from .player import Player


def create_layout(player: "Player") -> dmc.Stack:
    """Creates Player layout

    Args:
        player (Player): a Player object, contains all relevant information for the layout.

    Returns:
        dmc.Stack: A dmc.Stack containing all player UI elements - buttons, sliderds, etc.
    """
    layout = dmc.Stack(
        id=player.main_id,
        children=[
            dcc.Store(
                id=player.main_state_store_id,
            ),
            dcc.Store(
                id=player.speed_presets_store_id,
                data=player.speed_presets,
            ),
            dmc.Group(
                children=[dmc.Button() for i in range(5)],
                justify="center",
                wrap="nowrap",
            ),
            dmc.Slider(  # player position / playthrough progres
                id=player.step_slider_id,
                min=1,
                max=1,
                step=1,
                value=1,
                updatemode="mouseup",
            ),
            dmc.Slider(  # player speed
                id=player.speed_slider_id,
                marks=[
                    {
                        "value": value,
                        "label": f"{str(int(label/1000))+"K" if label >= 1000 else label}",
                    }
                    for value, label in enumerate(player.speed_presets)
                ],
                label=None,  # lambda value: str(speed_presets[value]), # Should be available in a future release
                min=0,
                max=len(player.speed_presets) - 1,
                restrictToMarks=True,
                value=2,
                updatemode="drag",
            ),
        ],
    )

    return layout
