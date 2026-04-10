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
import {PiScreencastThin} from "react-icons/pi";


export interface StreamingProps {
    stream?: MediaStream;
    websocket?: string | undefined;
}

export interface StreamingState {
    websocket?: WebSocket | undefined;
    isCopied?: boolean | undefined;
    selected?: Array<string>;
    clients?: Array<string>;
    error?: any;
}


export default class Streaming<
    Props extends StreamingProps = StreamingProps,
    State extends StreamingState = StreamingState
> extends React.Component<Props, State> {

    protected onReceivedClientsRef: (event: CustomEvent) => void;

    constructor(props: Props) {
        super(props);

        (this.state as StreamingState) = {
            clients: [],
            selected: [],
            error: undefined,
        };
    }

    componentDidMount() {
        this.onReceivedClientsRef = this.onReceivedClients.bind(this);
        document.addEventListener("scanner.clients", this.onReceivedClientsRef);
    }

    onReceivedClients(event: CustomEvent): void {
        return this.setState({
            clients: event?.detail || []
        });
    }

    onError(error) {
        return this.setState({
            error: error
        });
    }

    onSelectedScreen(screen: string): void {
        let collection = this?.state?.selected || [];
        if (collection.includes(screen)) {
            return;
        }

        collection.push(screen);

        return this.setState({
            selected: collection
        });
    }

    onToggledStart(event: any) {

        (this?.state?.websocket != undefined) &&
        this.doStopStreaming(this.state.websocket)
            .then(this.onStoppedStreaming.bind(this))
            .catch(this.onError.bind(this));

        (this?.state?.websocket == undefined) &&
        this.doStartStreaming(this?.props?.stream)
            .then(this.onStartedStreaming.bind(this))
            .catch(this.onError.bind(this));

        return this.setState({
            error: undefined,
        });
    }

    onStoppedStreaming() {
        return this.setState({
            websocket: undefined
        });
    }

    onStartedStreaming(websocket: WebSocket) {

        (this?.state?.selected?.length > 0) &&
        websocket.send(JSON.stringify(this.state.selected));

        return this.setState({
            websocket: websocket
        });
    }

    async doStartStreaming(stream: MediaStream): Promise<WebSocket> {
        return new Promise(async (resolve, reject) => {
            try {

                const socket = new WebSocket(this.props.websocket);
                socket.onerror = () => reject(new Error(`Failed: ${this.props.websocket}`));
                socket.onopen = () => resolve(socket);
                socket.onclose = () => recorder?.stop?.();

                const recorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm; codecs=vp8',
                    videoBitsPerSecond: 1000000
                });

                const closed: Array<number> = [
                    WebSocket.CLOSING,
                    WebSocket.CLOSED
                ];

                recorder.ondataavailable = (e) => {

                    (closed.includes(socket.readyState)) &&
                    (recorder?.stop?.());

                    (socket.readyState === WebSocket.OPEN) &&
                    (e?.data?.size > 0) && (socket?.send?.(e.data));
                };

                recorder.start(1000 / 30);

            } catch (err) {
                return reject(err);
            }

            return this.setState({
                error: undefined,
            });
        });
    }

    async doStopStreaming(websocket: WebSocket = this.state.websocket): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                websocket?.close?.(1000);
                return resolve();

            } catch (err) {
                return reject(err);
            }
        });
    }


    render() {
        return (<>
            {(this?.props?.stream) &&
                <Columns className={"Streaming"}>
                    <Columns.Column size={12} textAlign={"center"}>

                        <Heading subtitle={true} size={4} textAlign={"left"} my={1}>
                            Remote screens
                        </Heading>

                        {(!this?.state?.clients?.length) && <>
                            <Heading subtitle={true} size={6} textAlign={"left"} m={"0"}>
                                Searching...
                            </Heading>
                        </>}

                        {(this?.state?.clients?.length > 0) && <>
                            {this.state.clients.map((item, index) => {
                                return <Button onClick={() => this.onSelectedScreen(`${item}`)}
                                               color={`${this?.state?.selected.includes(item) && "info"}`}
                                               fullwidth={true}>
                                    <PiScreencastThin size={32}/>
                                    &nbsp;&nbsp;&nbsp;{item}
                                </Button>
                            })}
                        </>}
                    </Columns.Column>

                    {(this?.state?.error?.message == undefined && this?.state?.selected?.length > 0) &&
                        <Columns.Column size={12} textAlign={"center"}>
                            <Button onClick={this.onToggledStart.bind(this)}
                                    fullwidth={true}
                                    color={`${this.state.websocket == undefined ? "success" : "danger"}`}>
                                {`${this.state.websocket == undefined ? "Start " : "Stop"} Streaming`}

                            </Button>
                        </Columns.Column>}

                    {(this?.state?.error?.message != undefined && this?.state?.selected?.length > 0) &&
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
                </Columns>}
        </>)
    }
}
