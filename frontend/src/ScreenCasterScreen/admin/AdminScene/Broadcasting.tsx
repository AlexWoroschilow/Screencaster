// Copyright 2023 Alex Degner(alex.woroschilow@gmail.com)
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
// Do not rename, will be used in the game
import React from "react";
import {Button, Columns, Heading} from "react-bulma-components";
import {QRCodeSVG} from 'qrcode.react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Loader from "react-loader-spinner";

import "./Broadcasting.scss";
import {PiCopySimpleThin} from "react-icons/pi";


export interface BroadcastProps {
    offer?: string | undefined,
    server?: string | undefined,
    stream?: MediaStream;
}

export interface BroadcastState {
    peer?: RTCPeerConnection | undefined;
    isCopied?: boolean | undefined;
    error?: any;
}


export class Broadcasting<
    Props extends BroadcastProps = BroadcastProps,
    State extends BroadcastState = BroadcastState
> extends React.Component<Props, State> {


    constructor(props: Props) {
        super(props);

        (this.state as BroadcastState) = {
            error: undefined,
            peer: undefined,

        };
    }

    onError(error) {
        return this.setState({
            error: error
        });
    }


    onToggledStart(event: any) {

        (this?.state?.peer != undefined) &&
        this.doStopBroadcast(this.state.peer)
            .then(this.onStoppedBroadcast.bind(this))
            .catch(this.onError.bind(this));

        (this?.state?.peer == undefined) &&
        this.doStartBroadcast(this?.props?.stream)
            .then(this.onStartedBroadcast.bind(this))
            .catch(this.onError.bind(this));

        return this.setState({
            error: undefined,
        });
    }

    onStoppedBroadcast() {
        return this.setState({
            peer: undefined
        });
    }

    onStartedBroadcast(peer: RTCPeerConnection) {
        return this.setState({
            peer: peer
        });
    }

    async doStartBroadcast(stream: MediaStream) {
        return new Promise(async (resolve, reject) => {
            try {

                const pc = new RTCPeerConnection();

                stream.getTracks().forEach(track => {
                    (track?.kind === 'video') &&
                    pc.addTrack(track, stream);
                });

                const manipulateSDP = (sdp) => {
                    let modifiedSdp = sdp;

                    // 1. MTU/Message Size Fix
                    modifiedSdp = modifiedSdp.replace(/a=fingerprint(.*)\r\n/g,
                        "a=fingerprint$1\r\na=max-message-size:1200\r\n");

                    // 2. Erzwungene Keyframe-Anforderung (PLI/FIR) im SDP
                    // Dies sagt dem Empfänger, dass er aktiv neue Keyframes anfordern darf,
                    // wenn das Bild korrupt ist.
                    modifiedSdp = modifiedSdp.replace(/a=rtpmap:(\d+) VP8\/90000/g,
                        "a=rtpmap:$1 VP8/90000\r\na=rtcp-fb:$1 nack pli\r\na=rtcp-fb:$1 goog-remb\r\na=rtcp-fb:$1 ccm fir");

                    return modifiedSdp;
                };

                const offer = await pc.createOffer();
                const modifiedOffer = {type: offer.type, sdp: manipulateSDP(offer.sdp)};
                await pc.setLocalDescription(modifiedOffer);
                
                // Wir müssen warten, bis der Sender initialisiert ist
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');

                const parameters = sender.getParameters();

                parameters.encodings = [{
                    rid: "high",
                    maxBitrate: 1500000, // 1.5 Mbps für Stabilität
                    maxFramerate: 30,
                    // Erzwingt, dass die Bildqualität Priorität vor der Latenz hat,
                    // was indirekt zu saubereren Keyframes führt.
                    priority: 'high',
                    networkPriority: 'high',
                    // In einigen WebRTC-Versionen verfügbar:
                    // @ts-ignore
                    keyFrameInterval: 1000, // Ziel: 1 Keyframe pro Sekunde (1000ms)
                }];

                // WICHTIG: setParameters muss nach setLocalDescription
                // oder in einem stabilen Signalling-Zustand aufgerufen werden.
                await sender.setParameters(parameters).catch(console.error);

                fetch(this.props.offer, {
                    method: 'POST',
                    body: JSON.stringify({
                        sdp: pc.localDescription.sdp,
                        type: pc.localDescription.type,
                        role: 'broadcaster'
                    }),
                    headers: {'Content-Type': 'application/json'}
                }).then((res) => res.json())
                    .then(async (answer) => {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        return resolve(pc)
                    }).catch(this.onError.bind(this));

            } catch (err) {
                return reject(err)
            }
        });
    }

    async doStopBroadcast(peer: RTCPeerConnection = this?.state?.peer): Promise<void> {
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


    onClickedClipboard(e) {
        e.preventDefault();
        this.setState({isCopied: true});
        let timeout = setTimeout(() => {
            this.setState({isCopied: false})
            clearTimeout(timeout);
        }, 2000);
    }

    render() {
        return (<>
            <Columns className={"Broadcasting"}>
                {(this?.props?.server != undefined) &&
                    <>
                        <Columns.Column size={12} textAlign={"center"}>
                            <QRCodeSVG
                                value={this?.props?.server}
                                size={320}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"}
                            />

                            <CopyToClipboard text={this.props.server}>
                                <Button onClick={this.onClickedClipboard.bind(this)}
                                        fullwidth={true}>

                                    {(this?.state?.peer && this?.props?.stream) && <>
                                        <Loader type="Bars"
                                                color={"#000000"}
                                                height={20}
                                                width={50}/>
                                        &nbsp;
                                    </>}

                                    {(!this?.state?.isCopied) && <>{this?.props?.server} &nbsp;</>}
                                    {(this?.state?.isCopied) && <>Copied! &nbsp;&nbsp;</>}

                                    <PiCopySimpleThin style={{color: "#000d43"}} size={22}/>
                                </Button>
                            </CopyToClipboard>

                            {(this?.state?.error?.message == undefined && this?.props?.stream) &&
                                <>
                                    <Button onClick={this.onToggledStart.bind(this)}
                                            fullwidth={true}
                                            color={`${this.state.peer == undefined ? "success " : "danger"}`}>
                                        {`${this.state.peer == undefined ? "Start " : "Stop"} Broadcasting`}
                                    </Button>
                                </>}

                        </Columns.Column>
                    </>
                }


                {(this?.state?.error?.message != undefined && this?.props?.stream) &&
                    <Columns.Column size={12} textAlign={"center"}>
                        <Heading subtitle={true} size={4}>
                            {this.state.error.message}
                        </Heading>
                        <Button onClick={this.onToggledStart.bind(this)}
                                fullwidth={true}
                                color="success">
                            Try again
                        </Button>
                    </Columns.Column>}
            </Columns>

        </>)
            ;
    }
}
