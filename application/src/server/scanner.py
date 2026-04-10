import json
import logging
import socket
import time
import threading
from pathlib import Path

logger = logging.getLogger(Path(__file__).stem)


class Scanner:
    def __init__(self, port=3702, message="Hello"):
        self.port = port
        self.port_listen = port
        self.message = message
        self._is_running = False

    def broadcast(self):
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        client.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

        data = json.dumps({"message": self.message})

        try:
            logger.info(f"Broadcast: {data}")
            client.sendto(data.encode('utf-8'), ('<broadcast>', self.port))
        except Exception as e:
            logger.error(f"Error: {e}")
        finally:
            client.close()

    def listen(self):
        """Listens for responses from broadcasted messages."""
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            # server.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1) # Not strictly needed to receive directed responses
            server.settimeout(1.0)
            
            try:
                server.bind(("", self.port_listen))
                logger.info(f"Listen for answers on port {self.port_listen}")
                while self._is_running:
                    try:
                        data, addr = server.recvfrom(1024)
                        message = data.decode('utf-8', errors='ignore')
                        logger.info(f"Answer from [{addr[0]}]: {message}")
                    except socket.timeout:
                        continue
                    except Exception as e:
                        if self._is_running:
                            logger.error(f"Error receiving answer: {e}")
            except Exception as e:
                if self._is_running:
                    logger.error(f"Failed to bind listener for answers: {e}")

    def run(self, interval=5):
        self._is_running = True
        logger.info(f"Start: port={self.port}, interval={interval}s")
        
        # Start the listener in a separate thread
        threading.Thread(target=self.listen, daemon=True).start()

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
