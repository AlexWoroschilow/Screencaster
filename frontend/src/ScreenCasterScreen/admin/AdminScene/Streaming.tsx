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

import "./Streaming.scss";


export interface StreamingProps {
    stream?: MediaStream;
}

export interface StreamingState {
    peer?: RTCPeerConnection | undefined;
    isCopied?: boolean | undefined;
    error?: any;
}


export default class Streaming<
    Props extends StreamingProps = StreamingProps,
    State extends StreamingState = StreamingState
> extends React.Component<Props, State> {


    constructor(props: Props) {
        super(props);

        (this.state as StreamingState) = {
            error: undefined,
        };
    }

    onError(error) {
        return this.setState({
            error: error
        });
    }

    onToggledStart(event: any) {
        return this.setState({
            error: undefined,
        });
    }

    onStoppedStreaming(peer: RTCPeerConnection) {
        return this.setState({
            peer: undefined
        });
    }

    onStartedStreaming(peer: RTCPeerConnection) {
        return this.setState({
            peer: peer
        });
    }

    async doStartStreamin(stream: MediaStream): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {

                return resolve();

            } catch (err) {
                return reject(err);
            }
        });
    }

    async doStopStreaming(peer: RTCPeerConnection, stream: MediaStream): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {

                return resolve();

            } catch (err) {
                return reject(err);
            }
        });
    }


    render() {
        return (<>
            <Columns className={"Streaming"}>
                <Columns.Column size={12} textAlign={"center"}>
                    <Heading subtitle={true} size={3} m={"0"}>Streaming</Heading>
                </Columns.Column>

                {(this?.state?.error?.message == undefined) &&
                    <Columns.Column size={12} textAlign={"center"}>
                        <Button onClick={this.onToggledStart.bind(this)}
                                fullwidth={true}
                                color="success">
                            {`${this.state.peer == undefined ? "Start " : "Stop"} Streaming`}

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
