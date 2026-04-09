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
import AdminApplication from "./admin/AdminApplication";


let container = document.getElementById("admin");
if (container == undefined || container == null) {
    container = document.body.appendChild(document.createElement("div"));
    container.setAttribute("data-offer-url", "http://localhost:8080/offer");
    container.setAttribute("data-server-url", "http://localhost:8080");
    container.setAttribute("data-frame-rate", 30);
}

ReactDOM.createRoot(container).render(
    <AdminApplication
        offer={container.getAttribute("data-offer-url")}
        server={container.getAttribute("data-server-url")}
        frameRate={parseInt(container.getAttribute("data-frame-rate"))}
    />
);
