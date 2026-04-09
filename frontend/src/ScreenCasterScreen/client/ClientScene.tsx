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
import {Columns} from "react-bulma-components";
import undefinedError = Mocha.utils.undefinedError;


export interface ClientSceneProps {
}

export interface ClientSceneState {
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

        return this.setState({
            error: undefined
        });
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
        const stream = response.stream;
        // @ts-ignore
        this.videoRef.current.srcObject = stream;
        return this.setState({
            ...response
        });
    }

    async doStartBroadcast(): Promise<{ peer: RTCPeerConnection, stream: MediaStream }> {
        return new Promise(async (resolve, reject) => {

            try {

                const pc = new RTCPeerConnection();

                pc.ontrack = (event) => {
                    return resolve({peer: pc, stream: event.streams[0]})
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

        return <>
            <Columns className={"ClientScene"} centered={false} m={"0"} p={"0"}>
                <Columns.Column className={"ClientSceneStream"} size={12} m={"0"} p={"0"}>
                    <video ref={this.videoRef} autoPlay playsInline/>
                </Columns.Column>
            </Columns>

        </>;
    }
}
