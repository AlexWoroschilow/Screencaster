import logging
import sys
import asyncio
import ffmpeg
import websockets

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

class ScreencastWebsocketServer:
    def __init__(self, host="localhost", port=3000, udp_address="127.0.0.1", udp_port=1234):
        self.host = host
        self.port = port
        self.udp_address = udp_address
        self.udp_port = udp_port
        self.logger = logging.getLogger(self.__class__.__name__)

    async def _stream_handler(self, websocket):
        self.logger.info("Client connected")

        # Build the FFmpeg command using the fluent interface
        process = (
            ffmpeg
            .input('pipe:',
                   format='webm',
                   codec='vp8',
                   probesize=32,  # Minimum data for format detection
                   analyzeduration=0  # Skip stream analysis
                   )
            .filter('scale', 1920, 1080, force_original_aspect_ratio='decrease')
            .filter('pad', 1920, 1080, '(ow-iw)/2', '(oh-ih)/2')
            .output(
                f'udp://{self.udp_address}:{self.udp_port}',  # Destination IP and Port
                vcodec='libx264',
                preset='ultrafast',  # Zero encoding delay
                tune='zerolatency',  # Removes frame reordering (B-frames)
                format='mpegts',
                flush_packets=1,  # Send packets to UDP immediately
                bufsize='100k'  # Small buffer to prevent backlog
            )
            .run_async(pipe_stdin=True)
        )

        try:
            async for message in websocket:
                # Feed the binary message from WebSocket into FFmpeg's stdin
                process.stdin.write(message)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info("Client disconnected")
        except Exception as e:
            self.logger.error(f"Error in websocket stream: {e}")
        finally:
            if process.poll() is None:  # If process is still running, kill it
                process.terminate()
                self.logger.info("FFmpeg process terminated.")

    def run(self):
        """
        Runs the WebSocket server.
        Matches the interface of ScreencastServer.run().
        """
        async def main():
            async with websockets.serve(self._stream_handler, self.host, self.port):
                self.logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
                await asyncio.Future()  # Keep running indefinitely

        asyncio.run(main())

def run_websocket_server():
    server = ScreencastWebsocketServer()
    server.run()
