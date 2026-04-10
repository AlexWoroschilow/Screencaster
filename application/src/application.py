import logging
import os
import signal
import socket
import sys
import threading
import time
from pathlib import Path

import netifaces
import pystray
from PIL import Image

from .server.http import ScreencastServer
from .server.websocket import ScreencastWebsocketServer
from .server.scanner import Scanner
from .window.admin import AdminWindow

logger = logging.getLogger(Path(__file__).stem)


class Application:
    def __init__(self):
        self._scanner = Scanner(host=self.ip(), port=3702)
        self._http = ScreencastServer(host=self.ip(), port=8080)
        self._websocket = ScreencastWebsocketServer(host=self.ip(), udp_address=self.ip(), port=3000)
        self._admin_window = None

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
        if self._http is None:
            return None
        self._http.run()

    def websocket(self):
        if self._websocket is None:
            return None
        self._websocket.run()

    def scanner(self):
        if self._scanner is None:
            return None
        self._scanner.run()

    def scanner_results(self):
        while True:
            if self._admin_window is None: continue
            if self._scanner is None: continue
            self._admin_window.set_clients(
                self._scanner.clients
            )
            time.sleep(2)

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

        # Start servers in separate threads
        threading.Thread(target=self.http, daemon=True).start()
        threading.Thread(target=self.websocket, daemon=True).start()
        threading.Thread(target=self.scanner, daemon=True).start()
        threading.Thread(target=self.scanner_results, daemon=True).start()
        threading.Thread(target=self.tray, daemon=True).start()

        self._admin_window = AdminWindow(host=self.ip(), port=8080)
        self._admin_window.run()
