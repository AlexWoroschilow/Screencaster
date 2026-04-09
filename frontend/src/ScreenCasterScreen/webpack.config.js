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
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const baseConfigWrapper = require("../../webpack.common")

module.exports = baseConfigWrapper({
    entry: {
        Admin: path.resolve(__dirname, "./admin.js"),
        Client: path.resolve(__dirname, "./client.js"),
    },

    output: {
        chunkFilename: "static/ScreenCaster[name][contenthash].js",
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "Admin.html",
            chunks: ["Admin"],
        }),
        new HtmlWebpackPlugin({
            filename: "Client.html",
            chunks: ["Client"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, './static/'),
                    to: path.resolve(__dirname, '../../dist/static/')
                }
            ],
        }),
    ],
    devServer: {
        static: path.resolve(__dirname, "../../dist"),
        port: 9998,
    },
});
