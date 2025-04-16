hex = s => {
	let
		out = repeat(3, () => 0),
		hex = "0123456789ABCDEF"

	for (let col of range(3)) {
		for (let dig of range(2)) {
			out[col] *= 16
			out[col] += hex.indexOf(s[col * 2 + dig])
		}
	}

	return out
}

setColorToStatic = (color, static) => {
	if (static === undefined) {
		//skip
	} else if (typeof(static) == "string") {
		color.set(hex(static))
	} else if (Array.isArray(static)){
		color.set([...hex(static[0]), static[1]])
	} else {
		assert(false)
	}
}

let cw, cb

staticColors = {
	COLOR_WHITE: cw = "F7F7F7",
	COLOR_BLACK: cb = "704040",

	COLOR_WHITE_OUTLINE: "404040",
	COLOR_BLACK_OUTLINE: "302020",

	COLOR_CURSOR_OUTLINE: undefined,
	COLOR_CURSOR_FILL: undefined,

	COLOR_RED: "DD0000",

	COLOR_MENU_BG: ["000000", .5],

	COLOR_LIGHT_TILE: "F0D9B5",
	COLOR_DARK_TILE: "B58863",

	COLOR_LIGHT_PASSIVE: "819669",
	COLOR_DARK_PASSIVE: "656F41",

	COLOR_LIGHT_ACTIVE: "ADB17E",
	COLOR_DARK_ACTIVE: "847845",

	COLOR_LIGHT_LAST_MOVE: "CDD26A",
	COLOR_DARK_LAST_MOVE: "AAA23A",

	COLOR_CODE: "22CC11",
	
	COLOR_WINBAR_BASE: cw,
	COLOR_WINBAR_TOP: cb,
}

let i = 0
for (let colorID in staticColors) {
	global[colorID] = color(++i)
}

tileColors = [ //[color]
	COLOR_LIGHT_TILE,
	COLOR_DARK_TILE,
]

pieceColors = [ //[color]
	COLOR_WHITE,
	COLOR_BLACK,
]

pieceOutlineColors = [ //[color]
	COLOR_WHITE_OUTLINE,
	COLOR_BLACK_OUTLINE,
]

validTileColors = [ //[ord][color]
	[COLOR_LIGHT_ACTIVE , COLOR_DARK_ACTIVE ],
	[COLOR_LIGHT_PASSIVE, COLOR_DARK_PASSIVE],
]

lastTileColors = [ //[color]
	COLOR_LIGHT_LAST_MOVE,
	COLOR_DARK_LAST_MOVE,
]

setCursorColor = (color) => {
	COLOR_CURSOR_OUTLINE.copy(pieceOutlineColors[color])
	COLOR_CURSOR_FILL.copy(pieceColors[color])
}

BG_RAINBOW_FREQUENCY = 10
BG_RAINBOW_MIN_SUBPIXEL = 64
BG_RAINBOW_MAX_SUBPIXEL = 128

bgRainbowColourer = (colorI) =>
	range(0, 3)
	.map((j) =>
		j == colorI ?
			BG_RAINBOW_MIN_SUBPIXEL :
			BG_RAINBOW_MAX_SUBPIXEL
	)

startbgRainbow = () => {
	BG.set(bgRainbowColourer(2))
	gap()

	fn(bgRainbow).call().add()
}

bgRainbow = (fn) => {
	for (let i of range(3)) {
		BG.set(
			bgRainbowColourer(i),
			BG_RAINBOW_FREQUENCY,
		)
	}
	fn.call().add()
}