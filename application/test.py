import logging
import sys
from pathlib import Path

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

logger = logging.getLogger(Path(__file__).stem)

import requests
import gi

gi.require_version('Gst', '1.0')
gi.require_version('GstWebRTC', '1.0')
gi.require_version('GstSdp', '1.0')
from gi.repository import Gst, GstWebRTC, GstSdp

Gst.init(None)

# 1. Pipeline definieren
pipeline_str = "webrtcbin name=receiver videoconvert ! autovideosink"
pipeline = Gst.parse_launch(pipeline_str)
webrtc = pipeline.get_by_name('receiver')

def on_offer_set(promise, user_data):
    # Sobald das Remote-Offer gesetzt ist, erstellen wir eine Answer
    promise = Gst.Promise.new_with_change_func(on_answer_created, None)
    webrtc.emit('create-answer', None, promise)

def on_answer_created(promise, user_data):
    reply = promise.get_reply()
    answer = reply.get_value('answer')
    webrtc.emit('set-local-description', answer, None)
    # HINWEIS: Falls der Server eine Antwort erwartet, müsste die 'answer'
    # per HTTP POST an den Server zurückgeschickt werden.

def on_pad_added(element, pad):
    if not pad.has_current_caps(): return
    decodebin = Gst.ElementFactory.make('decodebin')
    decodebin.connect('pad-added', lambda _, p: p.link(pipeline.get_by_name('autovideosink').get_static_pad('sink')))
    pipeline.add(decodebin)
    decodebin.sync_state_with_parent()
    element.link(decodebin)

# Signale verbinden
webrtc.connect('pad-added', on_pad_added)

# 2. Offer von der URL abrufen
response = requests.post("http://192.168.2.89:8080/offer", {})
logger.info(f"{response}")
sdp_text = response.text
logger.info(f"{sdp_text}")

# 3. SDP parsen und in webrtcbin laden
res, sdpmsg = GstSdp.SDPMessage.new()
GstSdp.sdp_message_parse_buffer(bytes(sdp_text.encode()), sdpmsg)
offer = GstWebRTC.WebRTCSessionDescription.new(GstWebRTC.WebRTCSDPType.OFFER, sdpmsg)

pipeline.set_state(Gst.State.PLAYING)
promise = Gst.Promise.new_with_change_func(on_offer_set, None)
webrtc.emit('set-remote-description', offer, promise)

# Loop starten
from gi.repository import GLib
loop = GLib.MainLoop()
loop.run()