import logging
import sys
import threading
from src.client.listener import Listener

# Configure logging
log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

if __name__ == "__main__":
    listener = Listener(port=3702)

    # Start the listener using a separate thread, since the .run() method is now a blocking call.
    # Non-daemon thread keeps the script alive.
    threading.Thread(target=listener.run, daemon=False).start()
