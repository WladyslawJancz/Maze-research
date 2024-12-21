from dash import Dash, html, dcc, callback, Output, Input
import plotly.express as px
import pandas as pd
from app_layout import generate_layout

import random

app = Dash(__name__)
app.layout = generate_layout()

if __name__ == '__main__':
    app.run_server(debug=True)
