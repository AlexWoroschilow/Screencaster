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
				syntax: "typescript",
				tsx: true,
				// decorators: true,
				// dynamicImport: true
			},
			transform: {
				react: {
					runtime: "automatic",
					// refresh: true
				},
				// "legacyDecorator": true,
				// "decoratorMetadata": true,
			}
		}
	}
}
