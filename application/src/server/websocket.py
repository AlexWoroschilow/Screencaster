import asyncio
import json
import logging
import os
from pathlib import Path

import ffmpeg
import websockets

logger = logging.getLogger(Path(__file__).stem)


class ScreencastWebsocketServer:
    def __init__(self, host="localhost", port=3000, udp_address="127.0.0.1", udp_port=1234):
        self.host = host
        self.port = port
        self.udp_address = udp_address
        self.udp_port = udp_port

    def get_streamer(self, destination):
        return (
            ffmpeg
            .input('pipe:', format='webm', codec='vp8')
            # .filter('scale', 1920, 1080, force_original_aspect_ratio='decrease')
            # .filter('pad', 1920, 1080, '(ow-iw)/2', '(oh-ih)/2')
            .output(f'{destination}?pkt_size=1316',  # Destination IP and Port
                    vcodec='libx264',
                    preset='ultrafast',  # Zero encoding delay
                    tune='zerolatency',  # Removes frame reordering (B-frames)
                    format='mpegts')
            .run_async(pipe_stdin=True, cmd=os.environ.get("FFMPEG_BINARY", "ffmpeg"), quiet=False)
        )

    def get_streamer_destination(self, collection):
        if len(collection) == 1: return collection[0];
        return "|".join([f"[f=mpegts]{x}" for x in collection])

    async def _stream_handler(self, websocket):
        logger.info("Connected")

        process = None
        destination = None

        try:
            async for message in websocket:
                if isinstance(message, str):
                    destination = self.get_streamer_destination(json.loads(message))
                    logger.info(f"destination: {destination}")

                if isinstance(message, bytes):
                    if process is None:
                        if destination is None: continue
                        process = self.get_streamer(destination)
                        logger.info(f"process: {process}")

                    if process is None: continue
                    process.stdin.write(message)

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"disconnected: {process}")
        except Exception as e:
            logger.error(f"failed: {process} - {e}")
        finally:
            if process.poll() is None:
                logger.info(f"terminate: {process}")
                process.terminate()

    def run(self):
        """
        Runs the WebSocket server.
        Matches the interface of ScreencastServer.run().
        """

        async def main():
            async with websockets.serve(self._stream_handler, self.host, self.port):
                logger.info(f"WebSocket ws://{self.host}:{self.port}")
                await asyncio.Future()  # Keep running indefinitely

        asyncio.run(main())


def run_websocket_server():
    server = ScreencastWebsocketServer()
    server.run()
