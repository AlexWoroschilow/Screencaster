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

    def listen(self):
        """Starts the listener loop. This is a blocking call."""
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            except AttributeError:
                pass
            server.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

            # Set a timeout so we can periodically check the _is_running flag
            server.settimeout(1.0)

            try:
                server.bind((self.host, self.port))
                logger.info(f"Listening: {self.host}:{self.port}...")

                while self._is_running:
                    try:
                        data, addr = server.recvfrom(1024)
                        message = data.decode('utf-8', errors='ignore')
                        # Print to stdout as requested
                        logger.info(f"[{addr[0]}:{addr[1]}] Received: {message}")
                    except socket.timeout:
                        continue
                    except Exception as e:
                        if self._is_running:
                            logger.error(f"Error: {e}")
            except Exception as e:
                if self._is_running:
                    logger.error(f"Failed: {self.host}:{self.port}: {e}")
                    raise e
            finally:
                logger.info("Closed.")

    def run(self):
        """Runs the listener, restarting it if it crashes."""
        self._is_running = True
        logger.info("Starting...")
        while self._is_running:
            try:
                self.listen()
            except KeyboardInterrupt:
                logger.info("Interrupted by user.")
                self._is_running = False
            except Exception as e:
                if self._is_running:
                    logger.error(f"Error: {e}. Restarting in 5 seconds...")
                    time.sleep(5)
        logger.info("Listener execution finished.")

    def stop(self):
        """Stops the listener loop."""
        logger.info("Stopping Listener...")
        self._is_running = False
