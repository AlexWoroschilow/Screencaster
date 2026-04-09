import json
import logging
import os
from pathlib import Path

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay


class ScreencastServer:
    def __init__(self, host="localhost", port=8080):
        self.host = host
        self.port = port
        self.pcs = set()
        self.relay = MediaRelay()
        self.relay_track = None

    async def offer(self, request):
        params = await request.json()
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        role = params.get("role")
        logging.info(f"offer: {role}")

        pc = RTCPeerConnection()
        self.pcs.add(pc)

        @pc.on("track")
        def on_track(track):
            if role == "broadcaster":
                self.relay_track = track
                logging.info(f"Broadcaster track received: {track.kind}")

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logging.info(f"Connection state changed: {pc.connectionState}")
            if pc.connectionState in ["failed", "closed"]:
                await pc.close()
                self.pcs.discard(pc)

        await pc.setRemoteDescription(offer)

        # If a track exists, add it to the viewer's connection
        if role == "viewer":
            if self.relay_track:
                pc.addTrack(self.relay.subscribe(self.relay_track))
                logging.info("Added relayed track to viewer")
            else:
                logging.warning("Viewer connected but no broadcaster track available")

        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return web.Response(
            content_type="application/json",
            text=json.dumps({
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }),
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

    async def handle_options(self, request):
        return web.Response(
            status=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

    def run(self):

        app = web.Application()
        app.router.add_get("/", lambda r: web.FileResponse("static/Client.html"))
        app.router.add_post("/offer", self.offer)
        app.router.add_options("/offer", self.handle_options)

        static_path = os.path.join(os.getcwd(), 'static')
        logging.info(f"!!!{static_path}")

        app.router.add_static('/static/', path=static_path, name='static')

        web.run_app(app, host=self.host, port=self.port, handle_signals=False)
