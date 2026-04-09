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


export interface AdminSceneProps {
}

export interface AdminSceneState {
}


export class ClientScene<
    Props extends AdminSceneProps = AdminSceneProps,
    State extends AdminSceneState = AdminSceneState
> extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    render() {

        return <>
            Hello!

        </>;
    }
}
