import logging
import os
import signal
import socket
import sys
import threading
from pathlib import Path

import netifaces
import pystray
from PIL import Image

from .server.http import ScreencastServer
from .server.websocket import ScreencastWebsocketServer
from .window.admin import AdminWindow

logger = logging.getLogger(Path(__file__).stem)


class Application:
    def __init__(self):
        for item in self.ips():
            print(item)

    def ip(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 1))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    def ips(self):
        interfaces = netifaces.interfaces()

        for interface in interfaces:
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for link in addrs[netifaces.AF_INET]:
                    yield (interface, link['addr'],)

    def http(self):
        server = ScreencastServer(host=self.ip(), port=8080)
        server.run()

    def websocket(self):
        server = ScreencastWebsocketServer(host=self.ip(), udp_address=self.ip(), port=3000)
        server.run()

    def tray(self):
        image = Image.open(os.path.abspath("static/images/icon.png"))

        menu = pystray.Menu(pystray.MenuItem("Quit", self.exit))
        icon = pystray.Icon("screen-cast-tray", image, "Screencaster", menu)
        icon.run_detached()

    def exit(self, icon: pystray.Icon, item: pystray.MenuItem):
        icon.stop()
        os._exit(0)

    def signal(self, signal, frame):
        os._exit(0)

    def run(self):
        signal.signal(signal.SIGINT, self.signal)
        signal.signal(signal.SIGTERM, self.signal)

        # Start aiohttp server in a separate thread
        threading.Thread(target=self.http, daemon=True).start()
        threading.Thread(target=self.websocket, daemon=True).start()
        threading.Thread(target=self.tray, daemon=True).start()

        main_window = AdminWindow(host=self.ip(), port=8080)
        main_window.run()
