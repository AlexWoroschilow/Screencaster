import signal
import sys
import threading
import time

from PySide6.QtWidgets import QApplication

from src.window.admin import AdminWindow

def infinite_loop():
    while True:
        print("Infinite loop running...")
        time.sleep(1)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, sys.exit)
    signal.signal(signal.SIGTERM, sys.exit)

    # Start the infinite loop in a daemon thread
    thread = threading.Thread(target=infinite_loop, daemon=True)
    thread.start()

    app = QApplication(sys.argv)
    _admin_window = AdminWindow(host="127.0.0.1", port=8080)
    _admin_window.run()
    sys.exit(app.exec())
