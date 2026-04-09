// Copyright 2022 Alex Degner(alex.woroschilow@gmail.com)
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
import ReactDOM from "react-dom";
import ClientApplication from "./client/ClientApplication";


let container = document.getElementById("client");
if (container == undefined || container == null) {
    container = document.body.appendChild(document.createElement("div"));
    container.setAttribute("data-language", "de");
}

ReactDOM.createRoot(container).render(
    <ClientApplication/>
);
