import logging
import os
import sys
from pathlib import Path

from src.application import Application

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format, stream=sys.stdout)

logger = logging.getLogger(Path(__file__).stem)

[sys.path.append(path) if os.path.exists(path) else "" for path in [
    f"/usr/lib/python{sys.version_info.major}.{sys.version_info.minor}/dist-packages",
    f"/usr/lib/python{sys.version_info.major}.{sys.version_info.minor}/site-packages",
]]

try:
    import PySide6
except ImportError:
    try:
        import PyQt6
    except ImportError:
        logger.error("Missing PySide6/PyQt6...")
        os._exit(0)

if __name__ == "__main__":
    app = Application()
    app.run()
