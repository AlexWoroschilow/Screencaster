import logging
import sys
from pathlib import Path

from src.application import Application

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.ERROR, format=log_format, stream=sys.stdout)

logger = logging.getLogger(Path(__file__).stem)

if __name__ == "__main__":
    app = Application()
    app.run()
