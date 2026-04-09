module.exports = (isDev = false) => {
	return {
		$schema: "https://swc.rs/schema.json",
		parseMap: true,
		module: {
			type: "es6"
		},
		minify: !isDev,
		isModule: true,
		sourceMaps: true,
		// inlineSourcesContent: true,
		jsc: {
			minify: {
				compress: {
					"unused": true
					//!isDev
				},
				mangle: !isDev,
				format: {
					asciiOnly: true,
					comments: /^ webpack/
				}
 			},
			// target: "es2019",
			parser: {
				syntax: "ecmascript",
				jsx: true,
				// "dynamicImport": true,
				// "privateMethod": true,
				// "functionBind": true,
				// "classPrivateProperty": true,
				// "exportDefaultFrom": true,
				// "exportNamespaceFrom": true,
				// "decorators": true,
				// "decoratorsBeforeExport": true,
				// "importMeta": true,
			},
			transform: {
				react: {
					runtime: "automatic",
					// runtime: "classic",
					// refresh: true,
				}
			}
		}
	}
}
