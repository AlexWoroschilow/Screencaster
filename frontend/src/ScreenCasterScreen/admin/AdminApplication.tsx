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
import "./AdminApplication.scss";
import {AdminScene, AdminSceneProps} from "./AdminScene";


export interface AdminApplicationProps
    extends AdminSceneProps {
}

export interface AdminApplicationState {
}


export default class AdminApplication<
    Props extends AdminApplicationProps = AdminApplicationProps,
    State extends AdminApplicationState = AdminApplicationState
> extends React.Component<Props, State> {

    render() {
        return (<>

            <AdminScene {...this.props}/>

        </>);
    }
}
