import json
import logging
import socket
import time
from pathlib import Path

logger = logging.getLogger(Path(__file__).stem)


class Scanner:
    def __init__(self, port=3702, message="Hello"):
        self.port = port
        self.message = message

    def broadcast(self):
        # Create a UDP socket
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)

        # Enable port reusage so we can run multiple clients and servers on single (host, port).
        # Plus, on Windows, it is necessary to use setsockopt with SO_REUSEADDR.
        client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        # Enable broadcasting mode
        client.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

        data = json.dumps({"message": self.message})

        try:
            logger.info(f"Sending broadcast message: {data}")
            client.sendto(data.encode('utf-8'), ('<broadcast>', self.port))
        except Exception as e:
            logger.error(f"Failed to send broadcast: {e}")
        finally:
            client.close()

    def run(self, interval=5):
        logger.info(f"Starting Scanner broadcast every {interval} seconds on port {self.port}")
        while True:
            self.broadcast()
            time.sleep(interval)
