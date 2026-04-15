// Copyright 2025 Alex Degner(alex.woroschilow@gmail.com)
//
// Licensed under the Apache License, Version 2.0(the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
"use strict";

import React from "react";
import "./ClientScene.scss";
import {Heading} from "react-bulma-components";
import {VideoPlayer} from "./ClientScene/VideoPlayer";


export interface ClientSceneProps {
}

export interface ClientSceneState {
    isFullscreen?: boolean;
    peer?: RTCPeerConnection;
    stream?: MediaStream;
    error?: any
}


export class ClientScene<
    Props extends ClientSceneProps = ClientSceneProps,
    State extends ClientSceneState = ClientSceneState
> extends React.Component<Props, State> {

    protected videoRef: React.RefObject<HTMLVideoElement>;
    protected onToggledStartRef: () => void;
    protected onFullscreenChangeRef: () => void;
    protected intervalVideSync: ReturnType<typeof setInterval> | undefined;

    constructor(props: Props) {
        super(props);

        this.videoRef = React.createRef();

        (this.state as ClientSceneState) = {
            peer: undefined,
            stream: undefined,
            error: undefined
        };

    }

    componentDidMount() {

        this.onToggledStartRef = this.onToggledStart.bind(this);
        document.addEventListener("pointerup", this.onToggledStartRef);

        this.onFullscreenChangeRef = this.onFullscreenChange.bind(this);
        document.addEventListener("fullscreenchange", this.onFullscreenChangeRef);


        const videoElement = this?.videoRef?.current;

        (videoElement != undefined) &&
        (this.intervalVideSync = setInterval(() => {
            if (videoElement?.buffered?.length <= 0) {
                return;
            }

            const drift = videoElement.buffered.end(0) - videoElement.currentTime;

            (drift > 0.1) &&
            (videoElement.currentTime = videoElement.buffered.end(0));

        }, 1000));

        return this.setState({
            isFullscreen: this.isFullscreen(),
            error: undefined
        });
    }

    componentWillUnmount() {

        (this?.intervalVideSync != undefined) &&
        (clearInterval(this.intervalVideSync));

        (this?.onToggledStartRef != undefined) &&
        document.removeEventListener("pointerup", this.onToggledStartRef);

        (this?.onFullscreenChangeRef != undefined) &&
        document.addEventListener("fullscreenchange", this.onFullscreenChangeRef);
    }

    onFullscreenChange(event) {
        return this.setState({
            isFullscreen: this.isFullscreen(),
        })
    }

    isFullscreen() {
        return !!document?.fullscreenElement;
    }

    doFullscreenStart() {
        (document?.documentElement?.requestFullscreen) &&
        document.documentElement.requestFullscreen().catch((err) => {
            console.warn(`Error enabling fullscreen: ${err.message}`);
        });
    }

    doFullscreenStop() {
        return (document?.exitFullscreen) &&
            document.exitFullscreen();
    }

    onToggledFullscreen() {
        (!this.isFullscreen()) &&
        this.doFullscreenStart();

        (this.isFullscreen()) &&
        this.doFullscreenStop();

        return this.setState({
            isFullscreen: this.isFullscreen()
        })
    }

    onToggledStart(event: any) {
        if (this?.state?.peer && this?.state?.stream) {
            return this.onToggledFullscreen();
        }

        this.doStartBroadcast().then(this.onStartedBroadcast.bind(this))
            .catch(this.onError.bind(this));

        return this.setState({
            error: undefined,
        });
    }

    onStartedBroadcast(response: { peer: RTCPeerConnection, stream: MediaStream }) {
        // @ts-ignore
        (this?.videoRef?.current != undefined) &&
        (this.videoRef.current.srcObject = response.stream);

        (!this.isFullscreen()) &&
        this.doFullscreenStart();

        return this.setState({
            stream: response.stream,
            peer: response.peer,
        });
    }


    async doStartBroadcast(): Promise<{ peer: RTCPeerConnection, stream: MediaStream }> {
        return new Promise(async (resolve, reject) => {

            try {

                const pc = new RTCPeerConnection({
                    iceServers: [], // Force local-only if on the same LAN
                    bundlePolicy: 'max-bundle', // Bundle everything into one port
                    rtcpMuxPolicy: 'require'
                });

                pc.ontrack = (event) => {
                    pc.getReceivers().forEach((receiver: RTCRtpReceiver) => {
                        if (receiver?.track?.kind === 'video') return;

                        (receiver?.track?.kind == "video" && 'contentHint' in receiver?.track) &&
                        (receiver.track.contentHint = 'motion');

                        ('playoutDelayHint' in receiver) &&
                        (receiver.playoutDelayHint = 0);
                    });

                    const stream: MediaStream = event.streams[0];
                    if (stream == undefined) return reject(new Error("Missing stream"))

                    return resolve({
                        stream: stream,
                        peer: pc
                    })
                };

                pc.addTransceiver('video', {direction: 'recvonly'});

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const response = await fetch('/offer', {
                    method: 'POST',
                    body: JSON.stringify({
                        sdp: pc.localDescription.sdp,
                        type: pc.localDescription.type,
                        role: "viewer"
                    }),
                    headers: {'Content-Type': 'application/json'}
                });

                const answer = await response.json();
                await pc.setRemoteDescription(new RTCSessionDescription(answer));

            } catch (err) {
                return reject(err)
            }
        });
    }

    async doStopBroadcast(peer: RTCPeerConnection): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {

                if (peer == undefined) {
                    return resolve()
                }

                peer.getTransceivers()
                    .forEach((transceiver: RTCRtpTransceiver) => {
                        return transceiver?.stop?.();
                    });

                peer.close();

                return resolve()

            } catch (err) {
                return reject(err)
            }
        });
    }

    onError(error) {
        return this.setState({
            error: error
        });
    }

    render() {
        return (
            <div className="ClientScene">
                <div className="centered">
                    {(this?.state?.peer && !this?.isFullscreen()) &&
                        <Heading subtitle={true} size={3}>Click or tap to toggle Fullscreen</Heading>}

                    {(this?.state?.peer == undefined) &&
                        <Heading subtitle={true} size={3}>Click or tap to begin</Heading>}
                </div>

                {(this?.state?.stream != undefined) &&
                    <VideoPlayer
                        options={{
                            controls: false,
                            autoplay: true
                        }}
                        stream={this.state.stream}
                    />}
            </div>
        );
    }
}
