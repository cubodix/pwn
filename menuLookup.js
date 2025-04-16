SELECTABLE_GAP = null
MENU_LINE_MAX_LEN = 16
ARROW = ">                  "

defaultSelectableFilter = (text) =>
	text === SELECTABLE_GAP ||
	(text[0] != "[" &&
	text &&
	text != signature)

//signature

signatureFormat = [
	...repeat(22, () => ""),
	signature = "1.0          PWN",
]

//cursor

inMenuFormat = [
	0,
	"[UP KEY = Board]",
]

inBoardFormat = [
	0,
	"[UP KEY = Menu]",
]

//main menu

MAIN_MENU_PLAY_AS_WHITE = 0
MAIN_MENU_PLAY_AS_BLACK = 1
MAIN_MENU_PLAY_AS_RANDOM = 2

MAIN_MENU_WHITE_PLAYER = 3
MAIN_MENU_BLACK_PLAYER = 4
MAIN_MENU_PLAY_CUSTOM_GAME = 5

MAIN_MENU_BOARD_EDITOR = 6
MAIN_MENU_INITIAL_BOARD = 7
MAIN_MENU_CHESS324_BOARD = 8

MAIN_MENU_RANDOMIZED_GAME = 9
MAIN_MENU_BLINDFOLDED = 10
MAIN_MENU_SHOW_SOURCE_CODE = 11
MAIN_MENU_BEAT_LEVEL = 12

mainMenuItemFormat = [
	...repeat(20, () => 0),
	[beatLevelCounter = counter(), 14.7, 2],
]

mainMenuFormat = [
	0,
	"[Quick Game]",
	"play as white   ",
	"play as black   ",
	"play as random  ",
	0,
	"[Custom Game]",
	SELECTABLE_GAP, //white: engine/human
	SELECTABLE_GAP, //black: engine/human
	"play custom game",
	0,
	"[Custom Board]",
	"board editor    ",
	"initial board   ",
	"chess324 board  ",
	0,
	"[Miscellaneous]",
	"randomized game ",
	"blindfolded:    ", //blindfolded: off/on
	"show source code",
	"beat level      ",
]

mainMenuSelectables = mainMenuFormat.map(defaultSelectableFilter)
mainMenuSelectablesCount = mainMenuSelectables.filter(identity).length
mainMenuArrowsFormat = range(mainMenuFormat.length)
	.map((i) => mainMenuSelectables[i] ? ARROW : "")

mainMenuBeatLevelSignsFormats = [
	"           (00 )",
	"           (0  )",
	"           (   )",
].map((str) => [
	...repeat(20, () => 0),
	str,
])

customGameColorSettingFormats = repeat(colorsIter.length, () => []) //[color][playerType]

for (let color of colorsIter)
for (let player of playerTypesIter) {
	let optStr =
		["white", "black"][color]
		+ ": "
		+ ["human", "engine", "randomer"][player]

	customGameColorSettingFormats[color].push([
		...repeat(7 + +(color == BLACK), () => ""),
		optStr + " ".repeat(MENU_LINE_MAX_LEN - optStr.length),
	])
}

blindfoldedSettingFormats = [ //[state]
	[
		...repeat(18, () => 0),
		"             off",
	],
	[
		...repeat(18, () => 0),
		"             on ",
	],
]

//game menu

gameMenuFormat = [
	...repeat(9, () => 0),
	"nodes:          ",
	"nodes/s:        ",
	"depth:          ",
	"win%:           ",
	"score:          ",
]

gameMenuMoveFormat = [
	...repeat(3, () => 0),
	"go to main menu ",
]

gameMenuGameResultFormat = [
	0,
	"[Game Result]",
]

gameMenuPromotionFormat = [
	0,
	"[Promotion]",
	0,
	"promote queen   ",
	"promote rook    ",
	"promote bishop  ",
	"promote knight  ",
]

gameMenuPromotionSelectables = gameMenuPromotionFormat.map(defaultSelectableFilter)
gameMenuPromotionSelectablesCount = gameMenuPromotionSelectables.filter(identity).length
gameMenuPromotionArrowsFormat = range(gameMenuPromotionFormat.length)
	.map((i) => gameMenuPromotionSelectables[i] ? ARROW : "")

RESULT_WHITE_MATE = 0
RESULT_BLACK_MATE = 1
RESULT_STALEMATE = 2
RESULT_5_REPETITION = 3
RESULT_NO_MATE_MATERIAL = 4

gameMenuResultsFormats = [
	[ //RESULT_WHITE_MATE
		"1-0: white wins ",
		"black checkmated",
	],
	[ //RESULT_BLACK_MATE
		"1-0: black wins ",
		"white checkmated",
	],
	[ //RESULT_STALEMATE
		"1/2-1/2: draw   ",
		"stalemate       ",
	],
	[ //RESULT_5_REPETITION
		"1/2-1/2: draw   ",
		"5th repetition  ",
	],
	[ //RESULT_NO_MATE_MATERIAL
		"1/2-1/2: draw   ",
		"no mate material",
	],
].map((obj) => [...repeat(5, () => 0), ...obj])

gameMenuItemFormat = [
	...repeat(9, () => 0),
	[gameMenuNodes = counter(), 7],
	[gameMenuNodesPerSec = counter(), 9],
	[gameMenuDepth = counter(), 7],
	[gameMenuWinChance = timer(), 6],
	[gameMenuScore = timer(), 7],
]

gameMenuItems = [
	gameMenuNodes,
	gameMenuNodesPerSec,
	gameMenuDepth,
	gameMenuWinChance,
	gameMenuScore,
]

gameMenuArrowFormat = [
	...repeat(3, () => 0),
	ARROW,
]

//edit menu

EDIT_MENU_SAVE_AND_GO_BACK = 0

EDIT_MENU_EN_PASSANT = 1
EDIT_MENU_WHITE_CASTLE = 2
EDIT_MENU_BLACK_CASTLE = 3
EDIT_MENU_TURN = 4

EDIT_MENU_EMPTY_TILE = 5

EDIT_MENU_WHITE_PAWN = 6
EDIT_MENU_WHITE_KNIGHT = 7
EDIT_MENU_WHITE_BISHOP = 8
EDIT_MENU_WHITE_ROOK = 9
EDIT_MENU_WHITE_QUEEN = 10
EDIT_MENU_WHITE_KING = 11

EDIT_MENU_BLACK_PAWN = 12
EDIT_MENU_BLACK_KNIGHT = 13
EDIT_MENU_BLACK_BISHOP = 14
EDIT_MENU_BLACK_ROOK = 15
EDIT_MENU_BLACK_QUEEN = 16
EDIT_MENU_BLACK_KING = 17

editMenuWhitePieces = Object.fromEntries([
	[til.p, EDIT_MENU_WHITE_PAWN  ],
	[til.n, EDIT_MENU_WHITE_KNIGHT],
	[til.b, EDIT_MENU_WHITE_BISHOP],
	[til.r, EDIT_MENU_WHITE_ROOK  ],
	[til.q, EDIT_MENU_WHITE_QUEEN ],
	[til.k, EDIT_MENU_WHITE_KING  ],
])

editMenuBlackPieces = Object.fromEntries([
	[til.P, EDIT_MENU_BLACK_PAWN  ],
	[til.N, EDIT_MENU_BLACK_KNIGHT],
	[til.B, EDIT_MENU_BLACK_BISHOP],
	[til.R, EDIT_MENU_BLACK_ROOK  ],
	[til.Q, EDIT_MENU_BLACK_QUEEN ],
	[til.K, EDIT_MENU_BLACK_KING  ],
])

editMenuPieces =
	Object.assign(
		Object.fromEntries([
			[til._, EDIT_MENU_EMPTY_TILE  ],
		]),
		editMenuWhitePieces,
		editMenuBlackPieces,
	)

editMenuNonPieces = [
	EDIT_MENU_SAVE_AND_GO_BACK,
	EDIT_MENU_EN_PASSANT,
	EDIT_MENU_WHITE_CASTLE,
	EDIT_MENU_BLACK_CASTLE,
	EDIT_MENU_TURN,
]

editMenuBoardEditorFormat = [
	0,
	"[Board Editor]",
]

editMenuFormat = [
	...repeat(3, () => 0),
	"save and go back",
	SELECTABLE_GAP, //en-passant: A..H | none
	SELECTABLE_GAP, //w castle: off/on
	SELECTABLE_GAP, //b castle: off/on
	SELECTABLE_GAP, //turn: white/black
	"empty tile      ",
	"white pawn      ",
	"white knight    ",
	"white bishop    ",
	"white rook      ",
	"white queen     ",
	"white king      ",
	"black pawn      ",
	"black knight    ",
	"black bishop    ",
	"black rook      ",
	"black queen     ",
	"black king      ",
]

editMenuSelectables = editMenuFormat.map((text) => text !== 0)

editMenuSelectablesCount = editMenuSelectables.filter(identity).length

editMenuArrowsFormat = range(editMenuFormat.length)
	.map((i) => editMenuSelectables[i] ? ARROW : "")

editMenuSettings = [
	{
		menuI: EDIT_MENU_EN_PASSANT,
		name: "enpassant",
		vals: [..."ABCDEFGH".split(""), "none"],
		initDefault: initPos.enPassant,
		ogDefault: ogPos.enPassant,
	},
	{
		menuI: EDIT_MENU_WHITE_CASTLE,
		name: "w castle",
		vals: ["none", "O-O-O", "O-O", "both"],
		initDefault: initPos.castling[0] | initPos.castling[1] * 2,
		ogDefault: ogPos.castling[0] | ogPos.castling[1] * 2,
	},
	{
		menuI: EDIT_MENU_BLACK_CASTLE,
		name: "b castle",
		vals: ["none", "O-O-O", "O-O", "both"],
		initDefault: initPos.castling[2] | initPos.castling[3] * 2,
		ogDefault: ogPos.castling[2] | ogPos.castling[3] * 2,
	},
	{
		menuI: EDIT_MENU_TURN,
		name: "turn",
		vals: ["white", "black"],
		initDefault: initTurn,
		ogDefault: ogTurn,
	},
]

editMenuSettingConfigFormats = editMenuSettings.map((setting) =>
	setting.vals.map((val) => {
		let display = setting.name + ": " + val
		return [
			...repeat(3 + setting.menuI, () => 0),
			display + " ".repeat(MENU_LINE_MAX_LEN - display.length),
		]
	})
)