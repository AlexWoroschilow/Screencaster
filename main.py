import logging
import sys
import json
import threading
import os
import signal
from webui import webui
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format, stream=sys.stdout)

pcs = set()
relay = MediaRelay()
relay_track = None


async def offer(request):
    global relay_track
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    logging.info(f"offer: {params.get('role')}")

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("track")
    def on_track(track):
        global relay_track
        if params.get("role") == "broadcaster":
            relay_track = track
            logging.info(f"Broadcaster track received: {track.kind}")

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logging.info(f"Connection state changed: {pc.connectionState}")
        # if pc.connectionState in ["failed", "closed"]:
        #     await pc.close()
        #     pcs.discard(pc)

    await pc.setRemoteDescription(offer)

    # If a track exists, add it to the viewer's connection
    if params.get("role") == "viewer":
        if relay_track:
            pc.addTrack(relay.subscribe(relay_track))
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


async def handle_options(request):
    return web.Response(
        status=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )


if __name__ == "__main__":
    app = web.Application()
    app.router.add_get("/", lambda r: web.FileResponse("client.html"))
    app.router.add_get("/admin", lambda r: web.FileResponse("admin.html"))
    app.router.add_post("/offer", offer)
    app.router.add_options("/offer", handle_options)
    web.run_app(app, port=8080, handle_signals=False)
