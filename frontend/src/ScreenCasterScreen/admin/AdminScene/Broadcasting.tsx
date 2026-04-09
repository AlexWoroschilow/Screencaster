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

import "./Broadcasting.scss";
import {FaRegCopy} from "react-icons/fa";


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


export default class Broadcasting<
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
        this.doStopBroadcast(this.state.peer, this?.props?.stream)
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

    onStoppedBroadcast(peer: RTCPeerConnection) {
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
                    pc.addTrack(track, stream);
                });

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

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

    async doStopBroadcast(peer: RTCPeerConnection, stream: MediaStream): Promise<void> {
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
                <Columns.Column size={12} textAlign={"center"}>
                    <Heading subtitle={true} size={3} m={"0"}>Broadcasting</Heading>
                </Columns.Column>

                {(this?.props?.server != undefined) &&
                    <Columns.Column size={12} textAlign={"center"}>
                        <QRCodeSVG
                            value={this?.props?.server}
                            size={270}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"L"}
                        />
                        {(!this?.state?.isCopied) &&
                            <CopyToClipboard text={this.props.server}>
                                <Button onClick={this.onClickedClipboard.bind(this)}
                                        fullwidth={true}>
                                    {this?.props?.server} &nbsp;&nbsp;
                                    <FaRegCopy style={{color: "#000d43"}} size={22}/>
                                </Button>
                            </CopyToClipboard>}

                        {(this?.state?.isCopied) && <>
                            <Button fullwidth={true}>
                                Copied! &nbsp;&nbsp;
                                <FaRegCopy style={{color: "#000d43"}} size={22}/>
                            </Button>
                        </>}

                    </Columns.Column>}

                {(this?.state?.error?.message == undefined) &&
                    <Columns.Column size={12} textAlign={"center"}>
                        <Button onClick={this.onToggledStart.bind(this)}
                                fullwidth={true}
                                color="success">
                            {`${this.state.peer == undefined ? "Start " : "Stop"} Broadcasting`}

                        </Button>
                    </Columns.Column>}

                {(this?.state?.error?.message != undefined) &&
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
