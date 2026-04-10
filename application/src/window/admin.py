import json
import logging
from pathlib import Path
from typing import List

import webview
from webview import Window

logger = logging.getLogger(Path(__file__).stem)


class AdminWindow:
    def __init__(self, host="localhost", port=8080):
        self.host = host
        self.port = port
        self.window: Window = webview.create_window(
            'Screencast',
            "static/Admin.html",
            width=800,
            height=600)

    def set_clients(self, collection: List[str]):
        clients_json = json.dumps(collection)

        self.window.run_js(f"""
            document.dispatchEvent(new CustomEvent('scanner.clients', {{detail:{clients_json}}}));
        """)

    def load_html(self, window: Window):
        server = f"http://{self.host}:{self.port}"
        websocket = f"ws://{self.host}:3000"
        offer = f"{server}/offer"

        window.run_js(f"""
        const container = document.createElement('div');
        container.innerHTML = `<div id="admin"
                     data-offer-url="{offer}"
                     data-websocket-url="{websocket}"
                     data-server-url="{server}"
                     data-frame-rate="30"
                />`;
        document.body.appendChild(container);        
        """)

        window.run_js(f"""
        const script = document.createElement('script');
        script.src = 'Admin.js';
        document.body.appendChild(script);
        """)

    def run(self):
        webview.start(self.load_html, self.window)
