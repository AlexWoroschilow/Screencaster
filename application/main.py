import logging
import os
import signal
import sys
import threading
from pathlib import Path

import pystray
from PIL import Image
from webui import webui

from src.window import AdminWindow
from src.server import ScreencastServer
from src.websocket import ScreencastWebsocketServer

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

logger = logging.getLogger(Path(__file__).stem)

main_window = None


def run_server_http():
    ScreencastServer().run()


def run_server_websocket():
    ScreencastWebsocketServer().run()


# --- Tray Logic ---
def run_window():
    image = Image.open(os.path.abspath("src/static/images/icon.png"))

    menu = pystray.Menu(pystray.MenuItem("Quit", signal_exit))
    icon = pystray.Icon("screen-cast-tray", image, "Screencaster", menu)
    icon.run_detached()


def signal_exit(icon, item):
    icon.stop()
    os._exit(0)


def signal_handler(sig, frame):
    logging.info("Signal received, exiting...")
    webui.exit()
    os._exit(0)


if __name__ == "__main__":
    # Handle signals to ensure WebUI closes
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start aiohttp server in a separate thread
    threading.Thread(target=run_server_http, daemon=True).start()
    threading.Thread(target=run_server_websocket, daemon=True).start()
    threading.Thread(target=run_window, daemon=True).start()

    main_window = AdminWindow()
    main_window.run()
