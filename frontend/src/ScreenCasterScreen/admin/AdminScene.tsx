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
import "./AdminScene.scss";
import {Button, Columns, Heading} from "react-bulma-components";

export interface AdminSceneProps {
    frameRate: number | undefined,
    offer: string | undefined
}

export interface AdminSceneState {
    error?: any
}

export class AdminScene<
    Props extends AdminSceneProps = AdminSceneProps,
    State extends AdminSceneState = AdminSceneState
> extends React.Component<Props, State> {

    protected videoRef: React.RefObject<HTMLVideoElement>;

    constructor(props: Props) {
        super(props);

        this.videoRef = React.createRef();

        (this.state as AdminSceneState) = {
            error: undefined
        };
    }

    componentDidMount() {
        this.doStreamStart()
            .then((stream) => {
                // @ts-ignore
                this.videoRef.current.srcObject = stream;

                this.doStreamBroadcast(stream)
                    .catch(this.onError.bind(this));
            })
            .catch(this.onError.bind(this));

        return this.setState({
            error: undefined
        });
    }

    onError(error) {
        return this.setState({
            error: error
        });
    }

    async doStreamStart() {
        return new Promise(async (resolve, reject) => {

            try {
                const stream = await navigator.mediaDevices
                    .getDisplayMedia({
                        video: {frameRate: this.props.frameRate}
                    });

                return resolve(stream)


            } catch (err) {
                return reject(err)
            }
        });
    }

    async doStreamBroadcast(stream) {
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

    render() {

        return <>
            <Columns>
                <Columns.Column size={12}>
                    <Heading subtitle={true} size={2}>WebRTC Screencast Admin</Heading>
                    <Heading subtitle={true} size={4}>Broadcasting screen...</Heading>

                    {(this?.state?.error?.message != undefined) &&
                        <>
                            <Heading subtitle={true} size={4}>
                                {this.state.error.message}
                            </Heading>
                            <Button onClick={this.componentDidMount.bind(this)}
                                    color="success"
                                    renderAs="span">
                                Try again
                            </Button>
                        </>}


                </Columns.Column>
                <Columns.Column size={12}>
                    <video ref={this.videoRef}
                           autoPlay
                           playsInline
                           style={{
                               width: "100%",
                               height: "auto"
                           }}/>
                </Columns.Column>
            </Columns>


        </>;
    }
}
