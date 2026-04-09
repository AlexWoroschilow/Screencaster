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


export type AdminSceneProps<CustomConfig extends Record<any, any> = Record<any, any>> =
    & BroadcastProps
    & StreamingProps
    & CustomConfig
    & {
    frameRate: number | undefined,
    offer: string | undefined
}

export interface AdminSceneState {
    stream?: MediaStream;
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
            stream: undefined,
            error: undefined
        };
    }

    componentDidMount() {
        this.doStreamStart()
            .then((stream) => {
                // @ts-ignore
                this.videoRef.current.srcObject = stream;

                return this.setState({
                    stream: (stream as MediaStream)
                });
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
                        video: {
                            cursor: "always",
                            displaySurface: "monitor",
                            selfBrowserSurface: "exclude",
                            frameRate: this.props.frameRate,
                        },
                        audio: true
                    } as DisplayMediaStreamOptions);

                return resolve(stream)


            } catch (err) {
                return reject(err)
            }
        });
    }


    render() {

        return <>
            <Columns className={"AdminScene"} centered={true} m={"0"}>
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

                        {(this?.state?.stream != undefined) &&
                            <>
                                <Columns.Column size={12}>
                                    <Broadcasting {...this.props} stream={this.state.stream}/>
                                </Columns.Column>
                                <Columns.Column size={12}>
                                    <Streaming {...this.props} stream={this.state.stream}/>
                                </Columns.Column>
                            </>}

                    </Columns>

                </Columns.Column>
            </Columns>


        </>;
    }
}
