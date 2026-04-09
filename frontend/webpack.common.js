// Copyright 2026 Alex Degner(alex.woroschilow@gmail.com)
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
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (config, overwriter = (c, isDev) => c) => {
    return (env, argv) => {
        const isDev = argv.mode === 'development';
        // console.log('isDev:', isDev);

        let pluginsAdditional = [];
        // (isDev) && pluginsAdditional.push(
        //     new ForkTsCheckerWebpackPlugin({
        //         async: true,
        //         typescript: {
        //             memoryLimit: 8192,
        //             diagnosticOptions: {
        //                 semantic: true,
        //                 // syntactic: true,
        //                 // declaration: true,
        //                 // global: true
        //             },
        //             mode: 'readonly',
        //             // mode: 'write-references',
        //             // profile: true,
        //             // build: true,
        //             configFile: './tsconfig.json'
        //         }
        //     }));

        // SWC Loader
        return mergeObjects(overwriter({
            entry: {

            },

            devtool: (isDev ? "eval-cheap-module-source-map" : false),
            module: {
                rules: [
                    {
                        test: /\.(js|jsx)$/,
                        exclude: /node_modules/,
                        loader: "swc-loader",
                        options: require('./.swcrc_js')(isDev)
                    },
                    {
                        test: /\.tsx?$/,
                        exclude: /node_modules/,
                        loader: "swc-loader", // Use ForkTsCheckerWebpackPlugin with this
                        options: require('./.swcrc_ts')(isDev)
                    },
                    {
                        test: /\.(scss|css)$/,
                        use: [
                            "style-loader", //3. Inject styles into DOM
                            "css-loader", //2. Turns css into commonjs
                            {
                                loader: "sass-loader",
                                options: {
                                    api: "modern", // Fixes the Warning "The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0."
                                    sassOptions: {
                                        silenceDeprecations: ['legacy-js-api'],
                                        quietDeps: true,
                                    }
                                }
                            }, //1. Turns sass into css
                        ],
                    },
                ],
            },
            resolve: {
                extensions: ["*", ".tsx", ".ts", ".js", ".jsx"],
            },
            output: {
                path: path.resolve(__dirname, "./dist"),
                filename: "static/[name].js",
                pathinfo: false,
            },
            plugins: [...pluginsAdditional, ...[
                // new CopyWebpackPlugin({
                //     patterns: [
                //         // {
                //         //     from: path.resolve(__dirname, "./src/BodyTrackingScreen/static/"),
                //         //     to: path.resolve(__dirname, "./dist/static/"),
                //         // },
                //     ],
                // })
            ],
            ],
            watchOptions: {
                ignored: /node_modules/,
            },
            devServer: {
                static: path.resolve(__dirname, "./dist"),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                    "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
                }
            },
        }, isDev), config);
    }
};


function mergeObjects(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object';

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
        } else if (Array.isArray(targetValue) && !Array.isArray(sourceValue)) {
            targetValue.push(sourceValue);
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeObjects(Object.assign({}, targetValue), sourceValue);
        } else if (sourceValue !== undefined) {
            target[key] = sourceValue;
        }
    });

    return target;
}
