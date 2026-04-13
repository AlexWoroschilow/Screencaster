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
import {Simulate} from "react-dom/test-utils";
import {IoCloseOutline} from "react-icons/io5";


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

    doCloseStream(stream: MediaStream) {
        let tracks = undefined;
        (stream != undefined) &&
        (tracks = stream.getTracks());

        (tracks?.forEach != undefined) &&
        tracks.forEach((track: MediaStreamTrack) => {
            track?.stop?.(); // Beendet die Hardware-Nutzung (Kamera/Screen-Capture)
        });

        return this.setState({
            stream: undefined
        });
    }

    onClickedSource(surface: Surface): void {
        (this?.state?.stream != undefined) &&
        this.doCloseStream(this?.state?.stream);

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

    onClickedClose(event: any): void {
        (this?.state?.stream != undefined) &&
        this.doCloseStream(this?.state?.stream);

        return this.setState({
            surface: undefined
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

    onEndedTrack() {

        let tracks = undefined;
        (this?.state?.stream != undefined) &&
        (tracks = this.state.stream.getTracks());

        (tracks?.forEach != undefined) &&
        tracks.forEach(track => {
            track?.stop?.();
        });

        return this.setState({
            stream: undefined
        });
    }

    async doStreamStart(surface: Surface) {
        return new Promise((resolve, reject) => {

            try {
                navigator.mediaDevices
                    .getDisplayMedia({
                        video: {
                            cursor: "always",
                            displaySurface: surface,
                            selfBrowserSurface: "exclude",
                            frameRate: {ideal: 60, max: 60}
                        },
                        audio: false,
                        // audio: {
                        //     echoCancellation: false,
                        //     noiseSuppression: false,
                        //     autoGainControl: false,
                        //     latency: 0 // Suggests the lowest possible latency to the OS
                        // }
                    } as DisplayMediaStreamOptions)
                    .then((stream) => {
                        let tracks = stream.getTracks();

                        (tracks?.forEach != undefined) &&
                        tracks.forEach((track: MediaStreamTrack) => {

                            (track?.kind == "video" && 'contentHint' in track) &&
                            (track.contentHint = 'motion');


                            track.onended = this.onEndedTrack.bind(this);
                        });

                        return resolve(stream);
                    })
                    .catch((err) => {
                        return reject(err)
                    });

            } catch (err) {
                return reject(err)
            }
        });
    }


    render() {

        return <>
            <Columns className={"AdminScene"} centered={false} m={"0"}>
                <Columns.Column className={"AdminSceneStream"} size={12}>
                    <video ref={this.videoRef} autoPlay playsInline/>
                </Columns.Column>
                <Columns.Column className={"AdminSceneToolbox"} size={12}>
                    <Columns centered={true}>
                        <Columns.Column size={12} textAlign={"center"}>
                            <Button.Group>
                                <Button onClick={() => this.onClickedSource(Surface.monitor)}
                                        color={`${(this?.state?.stream != undefined && this?.state?.surface == Surface.monitor) && "info"}`}>
                                    <PiMonitorLight size={32}/>
                                    Screen
                                </Button>
                                <Button onClick={() => this.onClickedSource(Surface.window)}
                                        color={`${(this?.state?.stream != undefined && this?.state?.surface == Surface.window) && "info"}`}>
                                    <PiAppWindowLight size={32}/>
                                    Window
                                </Button>
                                <Button onClick={this.onClickedClose.bind(this)}
                                        disabled={this?.state?.stream == undefined}
                                        color={"danger"} outlined={true}>
                                    <IoCloseOutline size={32}/>
                                </Button>
                            </Button.Group>
                        </Columns.Column>

                        {(this?.state?.error?.message != undefined) &&
                            <Columns.Column size={12}>
                                <Heading subtitle={true} size={4}>
                                    {this.state.error.message}
                                </Heading>
                                <Button onClick={this.componentDidMount.bind(this)}
                                        color="info">
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
