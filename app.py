from dash import Dash, _dash_renderer
import dash_mantine_components as dmc
from app_layout import generate_layout

_dash_renderer._set_react_version("18.2.0")

app = Dash(__name__, external_stylesheets=dmc.styles.ALL)
app.layout = dmc.MantineProvider(generate_layout())

if __name__ == "__main__":
    app.run_server(debug=True)
