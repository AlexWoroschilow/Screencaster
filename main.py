import logging
import sys

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

import asyncio

import ffmpeg
import websockets


async def stream_handler(websocket):
    logging.info("Client connected")

    # Build the FFmpeg command using the fluent interface
    # input('pipe:', ...) tells FFmpeg to listen to stdin
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
            'udp://127.0.0.1:1234',  # Destination IP and Port
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
            logging.info("message")

        # When the socket closes, close the pipe so FFmpeg can finish gracefully
        process.stdin.close()
    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected")
    finally:
        if process.poll() is None:  # If process is still running, kill it
            process.terminate()
            logging.info("FFmpeg process terminated.")


async def main():
    # Start the WebSocket server on localhost:3000
    async with websockets.serve(stream_handler, "localhost", 3000):
        logging.info("Server started on ws://localhost:3000")
        await asyncio.Future()  # Keep running


if __name__ == "__main__":
    asyncio.run(main())
