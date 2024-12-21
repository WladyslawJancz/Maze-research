from dash import html
from create_labyrinth import create_labyrinth

def generate_layout():
    """Returns layout for main application page"""

    header = html.Div(
        id='app-header',
        children=html.H1('Application title/header'),
        style={
            'border-bottom':'2px solid black',
            'flex':'0',
            'padding':'1rem'
        }
    )
    
    body = html.Div(
        id='app-body',
        children=[],
        style={
            'background':'#D2D2D2',
            'flex':'1',
            'padding':'1rem',
            'overflow':'hidden'
        }
    )
    
    body_content = html.Div(
                id='body-content',
                children=[
                    html.Div(
                        id='content-placeholder',
                        children='Content placeholder',
                        style={'flex':'0'},
                    ),
                    html.Div(
                        id='labyrinth-container',
                        children=[
                            # 'ba',
                            create_labyrinth()
                        ],
                        style={
                            'flex':'1 0 50%',
                            'overflow':'hidden',
                        }
                    ),
                ],
                style={
                    'display':'flex',
                    'width':'100%',
                    'height':'100%',
                    'flex-flow': 'column nowrap',
                    'overflow':'hidden',
                    'justify-content':'flex-start',
                    # 'align-items':'center',
                }
            ),
    
    body.children = body_content

    layout = html.Div(
        id='main-container',
        children=[
            header,
            body
        ],
        style={
            'display':'flex',
            'flex-flow': 'column nowrap',
            'justify-content':'flex-start',
            'align-items':'stretch',
            'width':'100vw',
            'height':'100vh',
            'max-width':'100vw',
            'max-height':'100vh',
            'overflow':'hidden'
        }
    )

    return layout