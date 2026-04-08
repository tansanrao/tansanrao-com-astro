export const flexokiLightTheme = {
	name: "flexoki-light",
	type: "light" as const,
	semanticHighlighting: true,
	colors: {
		"editor.background": "#F2F0E5",
		"editor.foreground": "#100F0F"
	},
	settings: [
		{
			settings: {
				background: "#F2F0E5",
				foreground: "#100F0F"
			}
		},
		{
			name: "plain",
			scope: ["source", "text", "meta.embedded"],
			settings: {
				foreground: "#100F0F"
			}
		},
		{
			name: "comments",
			scope: ["comment", "punctuation.definition.comment"],
			settings: {
				foreground: "#6F6E69",
				fontStyle: "italic"
			}
		},
		{
			name: "keywords",
			scope: ["keyword", "storage", "storage.modifier", "storage.type", "punctuation.definition.keyword"],
			settings: {
				foreground: "#205EA6",
				fontStyle: "bold"
			}
		},
		{
			name: "strings",
			scope: ["string", "meta.string", "punctuation.definition.string", "string.template"],
			settings: {
				foreground: "#66800B"
			}
		},
		{
			name: "numbers and constants",
			scope: ["constant.numeric", "constant.language", "constant.character", "constant.other"],
			settings: {
				foreground: "#AD8301"
			}
		},
		{
			name: "functions",
			scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"],
			settings: {
				foreground: "#BC5215",
				fontStyle: "bold"
			}
		},
		{
			name: "methods",
			scope: ["entity.name.function.method", "meta.function.method", "support.function.method"],
			settings: {
				foreground: "#24837B"
			}
		},
		{
			name: "types",
			scope: ["entity.name.type", "entity.name.class", "entity.name.struct", "entity.name.enum", "support.type", "support.class"],
			settings: {
				foreground: "#DA702C"
			}
		},
		{
			name: "variables",
			scope: ["variable", "identifier", "support.variable"],
			settings: {
				foreground: "#100F0F"
			}
		},
		{
			name: "parameters",
			scope: ["variable.parameter"],
			settings: {
				foreground: "#4385BE"
			}
		},
		{
			name: "properties",
			scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name", "entity.other.attribute-name"],
			settings: {
				foreground: "#AF3029"
			}
		},
		{
			name: "tags",
			scope: ["entity.name.tag", "meta.tag"],
			settings: {
				foreground: "#24837B"
			}
		},
		{
			name: "operators and punctuation",
			scope: ["keyword.operator", "punctuation", "meta.brace", "meta.delimiter"],
			settings: {
				foreground: "#575653"
			}
		},
		{
			name: "invalid",
			scope: ["invalid", "invalid.illegal"],
			settings: {
				foreground: "#D14D41"
			}
		}
	]
};

export const flexokiDarkTheme = {
	name: "flexoki-dark",
	type: "dark" as const,
	semanticHighlighting: true,
	colors: {
		"editor.background": "#1C1B1A",
		"editor.foreground": "#CECDC3"
	},
	settings: [
		{
			settings: {
				background: "#1C1B1A",
				foreground: "#CECDC3"
			}
		},
		{
			name: "plain",
			scope: ["source", "text", "meta.embedded"],
			settings: {
				foreground: "#CECDC3"
			}
		},
		{
			name: "comments",
			scope: ["comment", "punctuation.definition.comment"],
			settings: {
				foreground: "#878580",
				fontStyle: "italic"
			}
		},
		{
			name: "keywords",
			scope: ["keyword", "storage", "storage.modifier", "storage.type", "punctuation.definition.keyword"],
			settings: {
				foreground: "#4385BE",
				fontStyle: "bold"
			}
		},
		{
			name: "strings",
			scope: ["string", "meta.string", "punctuation.definition.string", "string.template"],
			settings: {
				foreground: "#879A39"
			}
		},
		{
			name: "numbers and constants",
			scope: ["constant.numeric", "constant.language", "constant.character", "constant.other"],
			settings: {
				foreground: "#D0A215"
			}
		},
		{
			name: "functions",
			scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"],
			settings: {
				foreground: "#DA702C",
				fontStyle: "bold"
			}
		},
		{
			name: "methods",
			scope: ["entity.name.function.method", "meta.function.method", "support.function.method"],
			settings: {
				foreground: "#3AA99F"
			}
		},
		{
			name: "types",
			scope: ["entity.name.type", "entity.name.class", "entity.name.struct", "entity.name.enum", "support.type", "support.class"],
			settings: {
				foreground: "#DA702C"
			}
		},
		{
			name: "variables",
			scope: ["variable", "identifier", "support.variable"],
			settings: {
				foreground: "#CECDC3"
			}
		},
		{
			name: "parameters",
			scope: ["variable.parameter"],
			settings: {
				foreground: "#66A0C8"
			}
		},
		{
			name: "properties",
			scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name", "entity.other.attribute-name"],
			settings: {
				foreground: "#D14D41"
			}
		},
		{
			name: "tags",
			scope: ["entity.name.tag", "meta.tag"],
			settings: {
				foreground: "#3AA99F"
			}
		},
		{
			name: "operators and punctuation",
			scope: ["keyword.operator", "punctuation", "meta.brace", "meta.delimiter"],
			settings: {
				foreground: "#B7B5AC"
			}
		},
		{
			name: "invalid",
			scope: ["invalid", "invalid.illegal"],
			settings: {
				foreground: "#D14D41"
			}
		}
	]
};
