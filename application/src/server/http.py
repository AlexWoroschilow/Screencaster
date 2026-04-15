import json
import logging
import os
from pathlib import Path

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCRtpTransceiver
from aiortc.contrib.media import MediaRelay

logger = logging.getLogger(Path(__file__).stem)

from aiortc.rtp import RtcpPacket
from aiortc.codecs import get_capabilities  # <--- Wichtiger Import!

# Standard ist 1500, 1200 ist sicherer gegen Korruption
RtcpPacket.MTU = 1200


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
        logger.info(f"offer: {role}")

        pc = RTCPeerConnection()
        self.pcs.add(pc)

        @pc.on("track")
        def on_track(track):
            if role == "broadcaster":
                self.relay_track = track
                logger.info(f"Broadcaster track received: {track.kind}")

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state changed: {pc.connectionState}")
            if pc.connectionState in ["failed", "closed"]:
                await pc.close()
                self.pcs.discard(pc)

        await pc.setRemoteDescription(offer)

        # --- HIER DIE FIXES EINFÜGEN ---
        if role == "viewer":
            if self.relay_track:
                pc.addTrack(self.relay.subscribe(self.relay_track))

                capabilities = get_capabilities("video")

                vp8_codecs = [c for c in capabilities.codecs if c.name == "VP8"]
                other_codecs = [c for c in capabilities.codecs if c.name != "VP8"]

                # Den Transceiver für diesen Sender finden und Preferences setzen
                for transceiver in pc.getTransceivers():
                    if transceiver.kind == "video":
                        # Wir setzen VP8 an die erste Stelle
                        transceiver.setCodecPreferences(vp8_codecs + other_codecs)

                logger.info("Added relayed track to viewer with VP8 preferences")

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
        app.router.add_static('/static/', path=os.path.join(os.getcwd(), 'static'), name='static')
        app.router.add_options("/offer", self.handle_options)
        app.router.add_post("/offer", self.offer)

        web.run_app(app, host=self.host, port=self.port, handle_signals=False)
