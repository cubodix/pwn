COLOR_SQUARE = 211
COLOR_CIRCLE = 725
GLOW_HALF_SQUARE = 503
GLOW_CIRCLE = 1888
COLOR_SLOPE = 693
COLOR_SEMICIRCLE = 1837
OUTLINE_SQUARE = 467
GUIDE_TRIGGER = 2016
LINK_VISIBLE_TRIGGER = 3662

TILE_STEP = 30

BOARD_TILE_SIZE = 1
SIDE_TILE_SIZE = 0.25

BOARD_Y = 0

MENU_HEIGHT = 8
MENU_WIDTH = 4

SIDE_BOARD_Y = -TILE_STEP * 2

MENU_PADDING = TILE_STEP / 3
MENU_SCALING = 0.25

WINBAR_WIDTH =
	+ BOARD_TILE_SIZE / 5

WINBAR_HEIGHT =
	+ BOARD_TILE_SIZE * 8

BOARD_X =
	- TILE_STEP * 2
	- WINBAR_WIDTH * TILE_STEP / 2

WINBAR_X =
	+ BOARD_X
	+ BOARD_TILE_SIZE * 4 * TILE_STEP
	+ WINBAR_WIDTH / 2 * TILE_STEP

MENU_Y =
	+ BOARD_TILE_SIZE * 4 * TILE_STEP
	- 5

MENU_X =
	+ WINBAR_X
	+ WINBAR_WIDTH / 2 * TILE_STEP
	+ MENU_WIDTH / 2 * TILE_STEP

SIDE_BOARD_X =
	+ MENU_X

BOARD_BASE =
	+ BOARD_Y
	- BOARD_TILE_SIZE * 4 * TILE_STEP

BOARD_TOP =
	+ BOARD_BASE
	+ BOARD_TILE_SIZE * 8 * TILE_STEP

renderSquare = (color, x1, y1, x2, y2, thickness = 0) => {
	let
		yScale = (abs(y1 - y2) + thickness) / TILE_STEP,
		xScale = (abs(x1 - x2) + thickness) / TILE_STEP
	
	if (yScale == 0 || xScale == 0) {
		return undefined
	}

	return object({
		OBJ_ID: COLOR_SQUARE,
		COLOR: color,
		Y: (y1 + y2) / 2,
		X: (x1 + x2) / 2,
		SCALE_Y: yScale,
		SCALE_X: xScale,
	})
}

require("./pieceDisplay")

cursorAdditionalGs = [UIPointerBoard, gameMenuMove]

renderBoard = (
	//position
	y,
	x,
	scale,

	//pieces
	pieceRenderer,
	UIPieces,
	kingCursors, //[white, black]
	kings, //[white, black]
	kingChecks, //[white, black]
	allUIPieces, //grouped to all the pieces
	kingAsPointer, //only if pieceRenderer makes only 1 obj

	//the bottom left corner of the board
	blCornerG,

	//select cursor
	cursorG,

	//selected cursors
	lightSelectedG,
	darkSelectedG,

	//valid moves in board
	validsGs,

	//last move cursors
	fromCursor,
	fromLightCursor,
	fromDarkCursor,
	toCursor,
	toLightCursor,
	toDarkCursor,
	lastMoveCursor,

	//coords
	coords, //[white, black]
) => {
	let tileScale = scale * TILE_STEP

	object({
		OBJ_ID: COLOR_SQUARE,
		COLOR: COLOR_LIGHT_TILE,
		SCALING: scale * 8,
		Y: y,
		X: x,
	}).add()

	for (let tile of tilesIter) {
		let
			tileY = flr(tile / 8),
			tileX = tile % 8,
			tlCornerY = tileScale * 3.5 + y,
			tlCornerX = tileScale * -3.5 + x,
			tileYpos = tlCornerY - tileY * tileScale,
			tileXpos = tlCornerX + tileX * tileScale,
			darkTile = (tileX + tileY) % 2 == 1

		if (darkTile) {
			object({
				OBJ_ID: COLOR_SQUARE,
				...(tile == 56 && blCornerG ? {GROUPS: [blCornerG]} : {}),
				COLOR: COLOR_DARK_TILE,
				SCALING: scale,
				Y: tileYpos,
				X: tileXpos,
			}).add()
		}

		if (validsGs) {
			for (let ord of ordsIter) {
				let validColor = validTileColors[ord][+darkTile]
				
				for (let objN of range(4)) {
					let
						objSclMod = ord ? 1/7 : 1/6,
						objOffMod = ord ? -2 : 12.5,
						objOffY = objN < 2 ? -1 : 1,
						objOffX = objN % 3 ? -1 : 1

					object({
						OBJ_ID: ord ? COLOR_SEMICIRCLE : COLOR_SLOPE,
						COLOR: validColor,
						GROUPS: [validsGs[ord][tile]],
						ROTATION: objN * 90,
						SCALING: scale * objSclMod,
						Y: tileYpos + objOffY * objOffMod,
						X: tileXpos + objOffX * objOffMod,
					}).add()
				}
			}
		}
	}

	//coords
	if (coords) {
		let
			coordSimbols = ["HGFEDCBA", "12345678"],
			rightmost = x + tileScale * 3.5,
			downmost = y - tileScale * 3.5,
			centerOff = tileScale * 0.4

		for (let color of colorsIter) {
			let g = coords[color]

			for (let kind of range(2)) { //0: letters, 1: numbers
				for (let n of range(8)) {
					let
						simbol = coordSimbols[kind][color == WHITE ? n : 7 - n],
						off = n * tileScale,
						kindSign = kind == 0 ? -1 : 1
					
					simbol
						.to_obj()
						.with("Y", downmost + (kind == 1) * off + kindSign * centerOff)
						.with("X", rightmost - (kind == 0) * off + kindSign * centerOff)
						.with("COLOR", tileColors[1 - n % 2])
						.with("SCALING", .15)
						.with("GROUPS", [g])
						.add()
				}
			}
		}
	}

	let selecteds = [lightSelectedG, darkSelectedG]
	for (let selectedI in selecteds) {
		let selected = selecteds[selectedI]

		if (selected) {
			object({
				OBJ_ID: COLOR_SQUARE,
				COLOR: validTileColors[ORD_ACTIVE][+selectedI],
				GROUPS: [selected],
			}).add()
		}
	}

	let lastMoveCursors = [
		fromLightCursor,
		fromDarkCursor,
		toLightCursor,
		toDarkCursor,
	]

	for (let lastMoveCursorI in lastMoveCursors) {
		let isDarkTile = lastMoveCursorI % 2

		if (lastMoveCursors[lastMoveCursorI]) {
			object({
				OBJ_ID: COLOR_SQUARE,
				COLOR: lastTileColors[isDarkTile],
				GROUPS: [
					lastMoveCursors[lastMoveCursorI],
					lastMoveCursorI < 2 ? fromCursor : toCursor,
					lastMoveCursor,
				],
				Y: -TILE_STEP * 10,
			}).add()
		}
	}

	if (cursorG) {
		let cursorWidth = .07

		for (let layer of [-1, 1, 0]) {
			object({
				OBJ_ID: OUTLINE_SQUARE,
				COLOR: (
					layer == 0 ?
						COLOR_CURSOR_FILL :
						COLOR_CURSOR_OUTLINE
				),
				SCALING: 1 + layer * cursorWidth,
				GLOW_DISABLED: T,
				NO_TOUCH: T,
				GROUPS: [cursorG, ...cursorAdditionalGs],
				Y: tileScale * -3.5 + y,
				X: tileScale * -3.5 + x,
			}).add()
		}
	}

	if (kingCursors !== undefined) {
		for (let color of colorsIter) {
			if (!kingAsPointer) {
				object({
					OBJ_ID: COLOR_SQUARE,
					GROUPS: [kingCursors[color], alpha0],
					Y: -TILE_STEP * 10,
				}).add()
			}

			let group =
				kingAsPointer ?
					kingCursors[color] :
					kings[color]

			grouped(group)

			if (kingChecks !== undefined) {
				grouped(kingChecks[color])
				renderPieceCheckIndicator(0, -TILE_STEP * 10)
				grouped(kingChecks[color])
			}

			if (allUIPieces !== undefined) {
				grouped(allUIPieces)
			}

			pieceRenderer(-TILE_STEP * 10, 0, scale, color == WHITE ? til.k : til.K)

			if (allUIPieces !== undefined) {
				grouped(allUIPieces)
			}

			grouped(group)
		}
	}
	
	for (let tile of tilesIter) {
		let
			tileY = flr(tile / 8),
			tileX = tile % 8,
			tlCornerY = tileScale * 3.5 + y,
			tlCornerX = tileScale * -3.5 + x,
			tileYpos = tlCornerY - tileY * tileScale,
			tileXpos = tlCornerX + tileX * tileScale

		for (let piece of nonVoidOrKingPiecesIter) {
			let UIPiece = UIPieces[tile][nonVoidOrKingIdx(piece)]
	
			if (UIPiece !== undefined) {
				if (allUIPieces != undefined) {
					grouped(allUIPieces)
				}

				grouped(UIPiece)
				pieceRenderer(tileYpos, tileXpos, scale, piece)
				grouped(UIPiece)

				if (allUIPieces != undefined) {
					grouped(allUIPieces)
				}
			}
		}
	}
}

renderMenu = (menuFormat, cb = (obj, _) => obj) => {
	for (let i in menuFormat) {
		let text = menuFormat[i]

		if (!text) {
			continue
		}

		cb(
			text.to_obj()
				.with("Y", MENU_Y - i * MENU_PADDING)
				.with("X", MENU_X)
				.with("SCALING", MENU_SCALING),
			i,
		).add()
	}
}

renderItemMenu = (menuItemFormat, cb = (obj, _) => obj) => {
	for (let i in menuItemFormat) {
		if (!menuItemFormat[i]) {
			continue
		}

		let
			[item, off, align] = menuItemFormat[i],
			digitSize = 6.15

		cb(
			item.to_obj()
				.with("ALIGN", align ?? 1)
				.with("Y", MENU_Y - i * MENU_PADDING)
				.with("X", MENU_X + (off - MENU_LINE_MAX_LEN / 2) * digitSize)
				.with("SCALING", MENU_SCALING),
			i
		).add()
	}
}

winbarPolysGs = [ //[0: base, 1: dyn, 2: top][0: left, 1: right]
	[ //base
		baseLWinBarPoly,
		baseRWinBarPoly,
	],
	[ //dyn
		dynLWinBarPoly,
		dynRWinBarPoly,
	],
	[ //top
		topLWinBarPoly,
		topRWinBarPoly,
	],
]

initializeRender.ext(() => {
	let winbarParts = [
		{
			color: COLOR_WINBAR_BASE,
			polys: winbarPolysGs.slice(0, 2).flat()
		},
		{
			color: COLOR_WINBAR_TOP,
			polys: winbarPolysGs.slice(1, 3).flat()
		},
	]

	for (let winbarPart of winbarParts) {
		gradient(...repeat(2, () => winbarPart.color), ...winbarPart.polys).add()
	}
})

scrapped = scrapCode()
scrappedLineHeight = 6
scrappedWidthLimit = 80
scrappedYStart = -TILE_STEP * 5
scrappedScale = .17

renderUI = () => {
	object({
		OBJ_ID: GUIDE_TRIGGER,
		GUIDE_PREVIEW_OPACITY: 1,
		ZOOM: 1,
		GROUPS: [guide],
	}).add()

	//win bar

	const
		POLY_WINBAR_LEFT = 0,
		POLY_WINBAR_RIGHT = 1,
		POLY_WINBAR_BASE = 0,
		POLY_WINBAR_DYN = 1,
		POLY_WINBAR_TOP = 2

	for (let polyType in winbarPolysGs) {
		let polysByType = winbarPolysGs[polyType]
		for (let polySide in polysByType) {
			let poly = polysByType[polySide]
			object({
				OBJ_ID: COLOR_CIRCLE,
				GROUPS: [poly, alpha0],
				Y: polyType == POLY_WINBAR_BASE ? BOARD_BASE :
					polyType == POLY_WINBAR_TOP ? BOARD_TOP : 0,
				X: WINBAR_X
					+ WINBAR_WIDTH * (
						polySide == POLY_WINBAR_LEFT ?
							-TILE_STEP / 2 :
							TILE_STEP / 2
					),
			}).add()
		}
	}

	for (let off of range(-3, 3 + 1)) {
		if (off != 0) {
			for (let color of colorsIter) {
				object({
					OBJ_ID: COLOR_SQUARE,
					COLOR: pieceColors[color],
					GROUPS: [alpha60],
					SCALE_Y: 1 / TILE_STEP / 2,
					SCALE_X: WINBAR_WIDTH - .075,
					Y: off * TILE_STEP + (color == WHITE ? 0.25 : -0.25),
					X: WINBAR_X,
				}).add()
			}
		}
	}
	
	object({
		OBJ_ID: COLOR_SQUARE,
		COLOR: COLOR_RED,
		GROUPS: [alpha60],
		SCALE_Y: 2 / TILE_STEP,
		SCALE_X: WINBAR_WIDTH,
		X: WINBAR_X,
	}).add()
	
	//win bar shadow

	for (let side of range(2)) {
		object({
			OBJ_ID: GLOW_HALF_SQUARE,
			ROTATION: 90 + side * 180,
			COLOR: COLOR_RED,
			GROUPS: [alpha35],
			SCALE_Y: .1,
			SCALE_X: 8,
			X: WINBAR_X
				+ WINBAR_WIDTH / 2 * TILE_STEP * (side ? 1 : -1) * .66,
		}).add()
		
		object({
			OBJ_ID: GLOW_HALF_SQUARE,
			ROTATION: side * 180,
			COLOR: COLOR_RED,
			GROUPS: [alpha35],
			SCALE_Y: .1,
			SCALE_X: WINBAR_WIDTH,
			X: WINBAR_X,
			Y: WINBAR_HEIGHT / 2 * TILE_STEP * (side ? 1 : -1) * 0.991,
		}).add()
	}

	//menu bg

	object({
		OBJ_ID: COLOR_SQUARE,
		COLOR: COLOR_MENU_BG,
		SCALE_Y: MENU_HEIGHT,
		SCALE_X: MENU_WIDTH,
		X: MENU_X,
	}).add()

	//signature

	renderMenu(signatureFormat)

	//main menu

	renderMenu(
		mainMenuFormat,
		(obj, i) => {
			if (mainMenuSelectables[i]) {
				obj.with("COLOR", tileColors[i % 2])
			}
	
			return obj.with("GROUPS", [mainMenu])
		},
	)

	renderItemMenu(
		mainMenuItemFormat,
		(obj, i) => {
			if (mainMenuSelectables[i]) {
				obj.with("COLOR", tileColors[i % 2])
			}
	
			return obj.with("GROUPS", [mainMenu, mainMenuBeatLevelCounter])
		},
	)

	for (let formatI in mainMenuBeatLevelSignsFormats) {
		renderMenu(
			mainMenuBeatLevelSignsFormats[formatI],
			(obj, i) => {
				if (mainMenuSelectables[i]) {
					obj.with("COLOR", tileColors[i % 2])
				}
		
				return obj.with("GROUPS", [mainMenu, mainMenuBeatLevelSigns[formatI]])
			},
		)
	}

	{
		let i = 0
		renderMenu(
			mainMenuArrowsFormat,
			(obj, _) => obj
				.with("GROUPS", [mainMenu, mainMenuArrows[i++]]),
		)
	}

	for (let color of colorsIter) {
		for (let player of playerTypesIter) {
			renderMenu(
				customGameColorSettingFormats[color][player],
				(obj, i) => obj
					.with("GROUPS", [mainMenu, customGamePlayers[color][player]])
					.with("COLOR", tileColors[i % 2]),
			)
		}
	}

	for (let state of range(2)) {
		renderMenu(
			blindfoldedSettingFormats[state],
			(obj, i) => obj
				.with("GROUPS", [mainMenu, blindfoldedConfigs[state]])
				.with("COLOR", tileColors[i % 2]),
		)
	}

	//game menu

	renderMenu(
		gameMenuFormat,
		(obj, _) => obj
			.with("GROUPS", [gameMenu]),
	)

	renderMenu(
		gameMenuGameResultFormat,
		(obj, _) => obj
			.with("GROUPS", [gameMenu, gameMenuGameResultOn]),
	)

	renderMenu(
		gameMenuMoveFormat,
		(obj, i) => obj
			.with("COLOR", tileColors[i % 2])
			.with("GROUPS", [gameMenu, gameMenuMove]),
	)

	renderMenu(
		gameMenuPromotionFormat,
		(obj, i) => obj
			.with("COLOR", i == 1 ? COLOR_WHITE : tileColors[i % 2]) //if i is 1 it is the [pawn promotion] sign
			.with("GROUPS", [gameMenu, gameMenuPromotion]),
	)

	{
		let i = 0
		renderMenu(
			gameMenuPromotionArrowsFormat,
			(obj, _) => obj
				.with("GROUPS", [gameMenu, gameMenuPromotion, gameMenuPromotionArrows[i++]]),
		)
	}

	renderItemMenu(
		gameMenuItemFormat,
		(obj, _) => obj
			.with("GROUPS", [gameMenu]),
	)

	renderMenu(
		gameMenuArrowFormat,
		(obj, _) => obj
			.with("GROUPS", [gameMenu, gameMenuMove, UIPointerMenu])
	)
	
	for (let i in gameMenuResultsFormats) {
		gameMenuResultFormat = gameMenuResultsFormats[i]
		gameMenuResult = gameMenuResults[i]
		renderMenu(
			gameMenuResultFormat,
			(obj, _) => obj
				.with("GROUPS", [gameMenu, gameMenuResult]),
		)
	}

	//game menu & edit menu

	let inMenuInBoardConditions = [
		//if any group combination is true pointer menu is shown
		[gameMenu, gameMenuMove, gameMenuGameResultOff],
		...Object.values(editMenuPieces)
			.map((selectableI) =>
				[editMenu, editMenuArrows[selectableI]]
			),
	]

	for (let condition of inMenuInBoardConditions) {
		let pointerMenus = [
			[inMenuFormat, [UIPointerMenu, ...condition]], //only show if can move
			[inBoardFormat, [UIPointerBoard, ...condition]],
		]
	
		for (let [format, groups] of pointerMenus) {
			renderMenu(
				format,
				(obj, _) => obj
					.with("GROUPS", groups),
			)
		}
	}
	
	//edit menu

	let editorFormatConditions =
		Object.values(editMenuNonPieces)
		.map((selectableI) =>
			[editMenu, editMenuArrows[selectableI]]
		)

	for (let condition of editorFormatConditions) {
		renderMenu(
			editMenuBoardEditorFormat,
			(obj, _) => obj
				.with("GROUPS", condition),
		)
	}

	renderMenu(
		editMenuFormat,
		(obj, i) => obj
			.with("GROUPS", [editMenu])
			.with("COLOR", tileColors[i % 2]),
	)

	for (let arrowKind of range(2)) {
		let
			arrowUIPointer = [UIPointerMenu, UIPointerBoard][arrowKind],
			kind1format = [
				...repeat(EDIT_MENU_EMPTY_TILE + 3, () => 0),
				...editMenuArrowsFormat.slice(EDIT_MENU_EMPTY_TILE + 3),
			]
		
		renderMenu(
			arrowKind == 1 ? kind1format : editMenuArrowsFormat,
			(obj, i) => {
				obj.with("GROUPS", [editMenu, editMenuArrows[i - 3], arrowUIPointer])

				if (arrowKind == 1) {
					obj.with("COLOR", tileColors[i % 2])
				}

				return obj
			},
		)
	}
	
	for (let settingI in editMenuSettingConfigFormats) {
		let setting = editMenuSettingConfigFormats[settingI]
		for (let formatI in setting) {
			let format = setting[formatI]
			renderMenu(
				format,
				(obj, i) => obj
					.with("GROUPS", [editMenu, editMenuSettingConfigs[settingI][formatI]])
					.with("COLOR", tileColors[i % 2]),
			)
		}
	}
	
	//boards
	renderBoard(
		//position
		BOARD_Y,
		BOARD_X,
		BOARD_TILE_SIZE,

		//pieces
		renderPixelPiece,
		UIPieces,
		boardKingCursors,
		boardKings,
		boardKingChecks,
		blindfoldedConfigs[0],
		false,

		//the bottom left corner of the board
		boardBlCorner,
		
		//select cursor
		boardCursor,
		
		//selected cursors
		lightSelectedCursor,
		darkSelectedCursor,

		//valid moves in board
		boardValids,
		
		//last move cursors
		fromCursor,
		fromDarkCursor,
		fromLightCursor,
		toCursor,
		toDarkCursor,
		toLightCursor,
		lastMoveCursor,

		//coords
		coords,
	)

	grouped(gameMenu)
	renderBoard(
		//position
		SIDE_BOARD_Y,
		SIDE_BOARD_X,
		SIDE_TILE_SIZE,

		//pieces
		renderBasicPiece,
		UISidePieces,
		sideKingCursors,
		undefined,
		undefined,
		blindfoldedConfigs[0],
		true,

		//the bottom left corner of the board
		sideBlCorner,

		//select cursor
		undefined,
	
		//selected cursors
		undefined,
		undefined,
	
		//valid moves in board
		undefined,
	
		//last move cursors
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
	
		//coords
		undefined,
	)
	grouped(gameMenu)
	
	scrapped
		.forEach((s, i) => {
			if (s.length > 0) {
				(s + " ".repeat(Math.max(0, scrappedWidthLimit - s.length)))
					.slice(0, scrappedWidthLimit)
					.to_obj()
					.with("Y", -i * scrappedLineHeight + scrappedYStart)
					.with("GROUPS", [code])
					.with("COLOR", COLOR_CODE)
					.with("SCALING", scrappedScale)
					.add()
			}
		})

	object({
		OBJ_ID: COLOR_SQUARE,
		GROUPS: [codeScroll],
	}).add()

	code.follow(codeScroll, 1, 1, -1)
}

//visual interface
GUIDE_Y = TILE_STEP * 10
GUIDE_X = TILE_STEP * 20

guideRelative()
renderUI()
guideRelative()