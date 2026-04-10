import json
import logging
import socket
import time
from pathlib import Path

logger = logging.getLogger(Path(__file__).stem)


class Scanner:
    def __init__(self, host="", port=3702, message="Hello"):
        self.host = host
        self.port = port
        self.port_listen = port
        self.message = message
        self._is_running = False
        self.clients = []

    def broadcast(self):
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        client.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

        try:
            data = json.dumps({"message": self.message})
            client.sendto(data.encode('utf-8'), ('<broadcast>', self.port))
            logger.info(f"<broadcast> => : {data}")

            while True:
                try:
                    data, addr = client.recvfrom(1024)
                    screen = json.loads(data.decode())
                    if not screen: continue

                    logger.info(f"{addr[0]} => : {screen}")
                    if screen in self.clients: continue
                    self.clients.append(screen)

                except socket.timeout:
                    break

        except Exception as e:
            logger.error(f"Error: {e}")
        finally:
            client.close()

    def results(self):
        return self.clients

    def run(self, interval=5):
        self._is_running = True
        logger.info(f"Start: port={self.port}, interval={interval}s")

        while self._is_running:
            self.broadcast()
            for _ in range(interval * 10):
                if not self._is_running:
                    break
                time.sleep(0.1)
        logger.info("Stop")

    def stop(self):
        logger.info("Stopping")
        self._is_running = False
