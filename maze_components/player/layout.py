from typing import TYPE_CHECKING
import dash_mantine_components as dmc
from dash import dcc
from dash_iconify import DashIconify

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
            dmc.Button(
                id=player.show_hide_button_id,
                fullWidth=True,
                children="Animate maze creation",
                leftSection=DashIconify(
                    icon="mdi:movie-creation",
                    height=24,
                    width=32,
                ),
                p=8,
                n_clicks=0,
            ),
            dmc.Stack(
                id=player.player_body_id,
                children=[
                    dcc.Store(
                        id=player.main_state_store_id,
                    ),
                    dcc.Store(
                        id=player.speed_presets_store_id,
                        data=player.speed_presets,
                    ),
                    dmc.ButtonGroup(
                        children=[
                            dmc.Button(
                                id=player.button_rewind_2_id,
                                children=DashIconify(
                                    icon="mdi:step-backward-2",
                                    height=24,
                                    width=32,
                                ),
                                p=8,
                            ),
                            dmc.Button(
                                id=player.button_rewind_1_id,
                                children=DashIconify(
                                    icon="mdi:step-backward",
                                    height=24,
                                    width=32,
                                ),
                                p=8,
                            ),
                            dmc.Button(
                                id=player.button_play_id,
                                children=DashIconify(
                                    icon="mdi:play",
                                    height=24,
                                    width=32,
                                ),
                                p=8,
                                n_clicks=0,
                            ),
                            dmc.Button(
                                id=player.button_forward_1_id,
                                children=DashIconify(
                                    icon="mdi:step-forward",
                                    height=24,
                                    width=32,
                                ),
                                p=8,
                            ),
                            dmc.Button(
                                id=player.button_forward_2_id,
                                children=DashIconify(
                                    icon="mdi:step-forward-2",
                                    height=24,
                                    width=32,
                                ),
                                p=8,
                            ),
                        ],
                        m="auto",
                        # justify="center",
                        # wrap="nowrap",
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
                        persistence=True,
                    ),
                ],
                display="none",
            ),
        ],
    )

    return layout
