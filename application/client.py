import logging
import sys

import time
from ffpyplayer.player import MediaPlayer


def run_low_latency_player(url):
    # Map the CLI flags to ff_opts
    # fflags=nobuffer -> 'fflags': 'nobuffer'
    # flags=low_delay -> 'flags': 'low_delay'
    # -framedrop      -> 'framedrop': True
    options = {
        'fflags': 'nobuffer',
        'flags': 'low_delay',
        'framedrop': True,
        'probesize': 32,
        'analyzeduration': 0,
        'sync': 'ext'  # External clock sync often helps low latency
    }

    print(f"Opening stream: {url}")
    player = MediaPlayer(url, ff_opts=options)

    # The player runs in a background thread.
    # We need a loop to keep the main thread alive.
    while True:
        frame, val = player.get_frame()
        if val == 'eof':
            print("Stream ended.")
            break
        elif val == 'paused':
            time.sleep(0.01)
        else:
            # We don't need to manually sleep here as ffpyplayer
            # handles internal timing, but we yield to prevent 100% CPU usage.
            time.sleep(0.01)


if __name__ == "__main__":
    # Note: Use 0.0.0.0 if you are receiving from an external device,
    # or 127.0.0.1 if the sender is on the same machine.
    STREAM_URL = "udp://127.0.0.1:1234"
    run_low_latency_player(STREAM_URL)
