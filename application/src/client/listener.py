import json
import logging
import socket
import time
from pathlib import Path

logger = logging.getLogger(Path(__file__).stem)


class Listener:
    def __init__(self, host="", port=3702):
        self.host = host
        self.port = port
        self._is_running = False

    def get_local_ip(self):
        """Returns the local IP address of the machine."""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # doesn't even have to be reachable
            s.connect(('10.255.255.255', 1))
            IP = s.getsockname()[0]
        except Exception:
            IP = '127.0.0.1'
        finally:
            s.close()
        return IP

    def listen(self):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            except AttributeError:
                pass
            server.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            server.settimeout(1.0)

            try:
                server.bind((self.host, self.port))
                logger.info(f"Listen: {self.host}:{self.port}")

                while self._is_running:
                    try:
                        data, addr = server.recvfrom(1024)
                        message = data.decode('utf-8', errors='ignore')
                        logger.info(f"[{addr[0]}] Recv: {message}")

                        # Answer to the broadcast message
                        response = json.dumps({
                            "ip": self.get_local_ip(),
                            "port": self.port,
                            "status": "active"
                        })
                        server.sendto(response.encode('utf-8'), addr)
                        logger.info(f"Sent response to {addr[0]}")

                    except socket.timeout:
                        continue
                    except Exception as e:
                        if self._is_running:
                            logger.error(f"Error: {e}")
            except Exception as e:
                if self._is_running:
                    logger.error(f"Fail: {e}")
                    raise e
            finally:
                logger.info("Closed")

    def run(self):
        self._is_running = True
        logger.info("Start")
        while self._is_running:
            try:
                self.listen()
            except KeyboardInterrupt:
                logger.info("Interrupted")
                self._is_running = False
            except Exception as e:
                if self._is_running:
                    logger.error(f"Error: {e}. Retry in 5s")
                    time.sleep(5)
        logger.info("Stop")

    def stop(self):
        logger.info("Stopping")
        self._is_running = False
