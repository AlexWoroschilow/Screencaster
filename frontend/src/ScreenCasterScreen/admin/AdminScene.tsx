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
import Broadcasting, {BroadcastProps} from "./AdminScene/Broadcasting";
import Streaming, {StreamingProps} from "./AdminScene/Streaming";
import {PiAppWindowLight, PiMonitorLight} from "react-icons/pi";


export type AdminSceneProps<CustomConfig extends Record<any, any> = Record<any, any>> =
    & BroadcastProps
    & StreamingProps
    & CustomConfig
    & {
    frameRate: number | undefined,
    offer: string | undefined
}

export enum Surface {
    window = 'window',
    monitor = 'monitor',
}

export interface AdminSceneState {
    stream?: MediaStream;
    surface?: Surface;
    error?: any
}

export class AdminScene<
    Props extends AdminSceneProps = AdminSceneProps,
    State extends AdminSceneState = AdminSceneState
> extends React.Component<Props, State> {

    protected videoRef: React.RefObject<HTMLVideoElement>;
    protected broadcastingRef: React.RefObject<Broadcasting>;
    protected streamingRef: React.RefObject<Streaming>;

    constructor(props: Props) {
        super(props);

        this.videoRef = React.createRef();
        this.broadcastingRef = React.createRef();
        this.streamingRef = React.createRef();

        (this.state as AdminSceneState) = {
            stream: undefined,
            surface: undefined,
            error: undefined
        };
    }

    componentDidMount() {
        return this.setState({
            error: undefined
        });
    }

    onClickedSource(surface: Surface): void {
        if (surface == this?.state?.surface) {
            return;
        }

        if (this?.state?.stream) {
            // Holt alle Video- und Audio-Spuren
            const tracks = this.state.stream.getTracks();

            (tracks?.length) &&
            tracks.forEach(track => {
                track?.stop?.(); // Beendet die Hardware-Nutzung (Kamera/Screen-Capture)
            });
        }

        (this?.broadcastingRef?.current != undefined) &&
        this.broadcastingRef.current.doStopBroadcast().then(() => {

            (this?.broadcastingRef?.current?.onStoppedBroadcast) &&
            this.broadcastingRef.current.onStoppedBroadcast();

            (this?.streamingRef?.current != undefined) &&
            this.streamingRef.current.doStopStreaming().then(() => {

                (this?.streamingRef?.current?.onStoppedStreaming) &&
                this.streamingRef.current.onStoppedStreaming();

                this.doStreamStart(surface)
                    .then(this.onStartedStream.bind(this))
                    .catch(this.onError.bind(this));
            });

            (this?.streamingRef?.current == undefined) &&
            (this.doStreamStart(surface)
                .then(this.onStartedStream.bind(this))
                .catch(this.onError.bind(this)));
        });

        (this?.broadcastingRef?.current == undefined && this?.streamingRef?.current == undefined) &&
        (this.doStreamStart(surface).then(this.onStartedStream.bind(this))
            .catch(this.onError.bind(this)));

        return this.setState({
            surface: surface
        });
    }


    onError(error) {
        return this.setState({
            error: error
        });
    }

    onStartedStream(stream: MediaStream) {
        // @ts-ignore
        this.videoRef.current.srcObject = stream;

        return this.setState({
            stream: (stream as MediaStream)
        });
    }

    async doStreamStart(surface: Surface) {
        return new Promise(async (resolve, reject) => {

            try {
                const stream = await navigator.mediaDevices
                    .getDisplayMedia({
                        video: {
                            cursor: "always",
                            displaySurface: surface,
                            selfBrowserSurface: "exclude",
                            frameRate: {
                                ideal: this.props.frameRate,
                                max: this.props.frameRate
                            },
                        },
                        audio: false
                    } as DisplayMediaStreamOptions);

                return resolve(stream)


            } catch (err) {
                return reject(err)
            }
        });
    }


    render() {

        return <>
            <Columns className={"AdminScene"} centered={false} m={"0"}>
                <Columns.Column className={"AdminSceneStream"} size={6}>
                    <video ref={this.videoRef}
                           autoPlay
                           playsInline
                           style={{
                               width: "100%",
                               height: "auto"
                           }}/>
                </Columns.Column>
                <Columns.Column className={"AdminSceneToolbox"} size={6}>
                    <Columns>

                        <Columns.Column size={12}>
                            <Button.Group>
                                <Button onClick={() => this.onClickedSource(Surface.monitor)}
                                        color={`${this?.state?.surface == Surface.monitor && "info"}`}>
                                    <PiMonitorLight size={32}/>
                                    Screen
                                </Button>
                                <Button onClick={() => this.onClickedSource(Surface.window)}
                                        color={`${this?.state?.surface == Surface.window && "info"}`}>
                                    <PiAppWindowLight size={32}/>
                                    Window
                                </Button>
                            </Button.Group>
                        </Columns.Column>

                        {(this?.state?.error?.message != undefined) &&
                            <Columns.Column size={12}>
                                <Heading subtitle={true} size={4}>
                                    {this.state.error.message}
                                </Heading>
                                <Button onClick={this.componentDidMount.bind(this)}
                                        color="success"
                                        renderAs="span">
                                    Try again
                                </Button>
                            </Columns.Column>}


                        <Columns.Column size={12}>
                            <Broadcasting {...this.props}
                                          ref={this.broadcastingRef}
                                          stream={this.state.stream}/>
                        </Columns.Column>
                        <Columns.Column size={12}>
                            <Streaming {...this.props}
                                       ref={this.streamingRef}
                                       stream={this.state.stream}/>
                        </Columns.Column>

                    </Columns>

                </Columns.Column>
            </Columns>


        </>;
    }
}
