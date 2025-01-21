//reserved ids
staticCounters = [
	//general
	"tickTimer",
	"targetTurn",
	"isInitialized",

	//movegen
	"srcY",
	"srcX",
	"srcT",
	"srcPost",
	"dst",
	"movChu",
	"movOff",
	"specialAnabolism",
	"fullCastleChecked",
	"wasPromotion",

	//analysis
	"oldOrd",
	"engineOn",
	"randomerOn",
	"nodeIdx",
	"best",
	"nodeCount",
	"depth",
	"rootChildsCount",
	"sideBoardRefreshCountdown",
	"engineTurnedOnInTick",
	"ordererRecordLength",
	"isFirstUnordered",

	//game
	"insufficientMaterialCheckResult",
	"checkingIfLegalMove",
	"validMovesCount",
	"isCapturingMove",

	//zobrist
	"zobristResult",
	"zobristRecordMatchsResult",

	//UI
	"sourceCodeUsed",
	"cursorIdx",
	"humanOn",

	"selectedPiece",
	"movegenUICallbackType",

	"playerTypeToMove",
	"playerTypeToWait",

	"isPlayerToMoveAuto",
	"isPlayerToWaitAuto",

	"fromCursorIdx",
	"toCursorIdx",

	"isBoardHFlipped",
	"isBoardNtVFlipped",

	"targetCursorIdx",
	"validDst",
]

staticGroups = [
	//movegen
	"moveGenBreak",

	//analysis
	"engineStepBreak",

	//inputs
	"inputBreak",
	
	//UI
	"guide",
	"guided",
	"alpha0",
	"alpha35",
	"alpha60",
	"codeScroll",
	"code",

	"whiteKingCursor",
	"blackKingCursor",

	"whiteSideKingCursor",
	"blackSideKingCursor",

	"whiteKing",
	"blackKing",
	
	"whiteKingCheck",
	"blackKingCheck",

	"boardCursor",

	"lightSelectedCursor",
	"darkSelectedCursor",

	"fromCursor",
	"fromLightCursor",
	"fromDarkCursor",

	"toCursor",
	"toLightCursor",
	"toDarkCursor",

	"boardBlCorner",
	"sideBlCorner",

	"lastMoveCursor",

	"UIPointerBoard",
	"UIPointerMenu",

	"mainMenu",
	"gameMenu",
	"editMenu",

	"mainMenuBeatLevelCounter",
	"gameMenuMove",
	"gameMenuPromotion",
	"gameMenuGameResultOn",
	"gameMenuGameResultOff",

	"editBoardOkClickBreak",
	"menuOkClickBreak",

	"baseLWinBarPoly",
	"baseRWinBarPoly",
	"dynLWinBarPoly",
	"dynRWinBarPoly",
	"topLWinBarPoly",
	"topRWinBarPoly",

	"whiteCoords",
	"blackCoords",
]

staticFunctions = [
	//general
	"rng",
	"initialize",
	"initializeRender",

	//movegen
	"softSrcBreakFn",
	"srcBreak",
	"moveGen",

	//analysis
	"rateBoard",
	"rateInit",
	"decabolismCallback",
	"engineDecabolism",
	"engineStep",
	"engineDepthDone",
	"computerEngineStep",
	"computerRandomerStep",
	"engineMove",

	//game
	"insufficientMaterialCheck",
	"gameTurn",
	"gameTurnEnd",
	"gameTerminate",
	"gameStart",
	"gameStartFromTarget",
	"gameQuit",

	//zobrist
	"zobristHash",
	"zobristRecordReset",
	"zobristRecordPush",
	"zobristRecordMatchs",

	//UI
	"movegenUICallback",
	"cleanBoardEffects",
	"drawBoardEffects",
	"clearBoard",
	"refreshBoard",
	"targetPosReset",
	"drawLastBoardTiles",

	"putBoardTile",
	"putSideTile",

	"putBoardKingTile",
	"putSideKingTile",

	"showIfEvenIdx",
	"showIfOddIdx",

	"winbarTick",

	//interaction
	"selectPromotion",
	"doPromotionMove",
	"humanMove",
	"boardOkClick",
	"menuUpClick",
	"menuDownClick",
	"menuOkClick",
	"selClick",
]

staticTimers = [
	//general
	"rngResult",
	
	//analysis
	"randomerChoice",
	"winbarPos",
]

statics = [
	{
		ids: staticCounters,
		fn: counter,
	},
	{
		ids: staticGroups,
		fn: unknown_g,
	},
	{
		ids: staticFunctions,
		fn: emptyFn,
	},
	{
		ids: staticTimers,
		fn: timer,
	},
]

for (let static of statics) {
	for (let id of static.ids) {
		global[id] = static.fn()
	}
}

//temporals shouldn't bound outside a tick
tmpC = repeat(17, counter)
tmpT = repeat(1, timer)
tmpG = repeat(2, unknown_g)

noRayNextMovs = [ //[isPromotion]
	repeat(MAX_PASSIVE_NO_RAY_MOVES_PER_PIECE, emptyFn),
	repeat(MAX_PROMOTIONS_PER_PIECE, emptyFn),
]

displayPos = newPosition()
targetPos = newPosition()
boardValids = repeat(2, () => repeat(64, emptyFn))
checkNode = repeat(2, emptyFn)
copyBoard = repeat(2, () => repeat(2, emptyFn))

weighedPestoTable = repeat(nonVoidPiecesIter.length, () => ({}))

for (let piece of nonVoidPiecesIter) {
	for (let tile of tilesIter) {
		let
			tileMap = isPieceWhite(piece) ? identity : flipVPos,
			p = pieceIntoWhite(piece),
			t = tileMap(tile),
			mgPositional = pestoTable[MIDDLE_GAME][p][t],
			egPositional = pestoTable[END_GAME][p][t]

		if ( //is this weighedPestoValue worth storing?
			mgPositional !== null && //piece can't be here
			egPositional !== null //piece can't be here
		) {
			weighedPestoTable[nonVoidIdx(piece)][tile] = counter()
		}
	}
}

nodes = repeat(engineMaxDepth, newNode)
nodeZ = newAnalyzer()
nodeA = newNode()
nodeB = newNode()

UIPieces = repeat(64, () => ({})) 
UISidePieces = repeat(64, () => ({}))
boardKingCursors = [whiteKingCursor, blackKingCursor]
sideKingCursors = [whiteSideKingCursor, blackSideKingCursor]
boardKings = [whiteKing, blackKing]
boardKingChecks = [whiteKingCheck, blackKingCheck]
coords = [whiteCoords, blackCoords]

for (let piece of nonVoidOrKingPiecesIter) {
	for (let tile of tilesIter) {
		let nonVoidOrKing = nonVoidOrKingIdx(piece)

		//check if piece can't be there
		if (flr(tile / 8) % 7 != 0 || (piece != til.p && piece != til.P)) {
			UIPieces[tile][nonVoidOrKing] = unknown_g()
			UISidePieces[tile][nonVoidOrKing] = unknown_g()
		}
	}
}

//engine eval movegens
thisMove = newMovegen() //the actual root move
depthMove = newMovegen() //the best move in this depth
bestMove = newMovegen() //best move overall

require("./menuLookup")

mainMenuArrows = repeat(mainMenuSelectablesCount, unknown_g)
mainMenuBeatLevelSigns = repeat(mainMenuBeatLevelSignsFormats.length, unknown_g)
editMenuArrows = repeat(editMenuSelectablesCount, unknown_g)
gameMenuPromotionArrows = repeat(gameMenuPromotionSelectablesCount, unknown_g)

gameMenuResults = repeat(gameMenuResultsFormats.length, unknown_g)
customGamePlayers = repeat(2, () => repeat(playerTypesIter.length, unknown_g)) //[color][playerType]
editMenuSettingConfigs = editMenuSettings.map((config) => repeat(config.vals.length, unknown_g))
blindfoldedConfigs = repeat(2, unknown_g)
playerType = repeat(2, counter)
turn = counter()

ordererRecord = repeat(engineOrdererRecordLength, newOrderer)
newOrdererRecord = repeat(engineOrdererRecordLength, newOrderer)
tmpOrderers = repeat(2, newOrderer)
zobristRecord = repeat(zobristRecordLength, counter)

//bitTable
bitTable = repeat(64, unknown_g)
zobristTmps = bitTable.slice(0, 64)
insufficientMaterialCheckTmps = bitTable.slice(0, 64)
spacesInBoardTmps = bitTable.slice(0, 64)
boardOkClickTmps = bitTable.slice(0, 64)
editBoardOkClickTmps = bitTable.slice(0, 64)
gamePhaseTmps = bitTable.slice(0, 64)
enPassantPieceCheckTmps = bitTable.slice(0, 8)
castlingCheckTmps = bitTable.slice(0, 8)
chess324CheckTmps = bitTable.slice(0, 5)

//delay avoid errors when using inputs at the start of the level
//and renderization should be initialized at the same time as inputs
RENDER_INITIALIZATION_DELAY = 3 //delay in ticks

initialize.ext(() => {
	defImms(
		9, 7, 1, 8, -9, -7, -1, -8, //ray steps
		tileCh.length - 1, //last piece idx
		til.q - til.n, //promotion diff
		til.q, //promotion diff
		til.q + 4, //promotion diff + promotions possibles
		0, 7, 56, 63, //board corners
		4, //different promotions possible
		...piecesIter, //save every piece as immutable
		24, //max game phase
		...range(8), //required for zobrist
		NO_ENPASSANT, //required for zobrist
	)

	isInitialized.set(T)
	guided.alpha(0)

	let i = 0
	for (let staticColor of Object.values(staticColors)) {
		setColorToStatic(color(++i), staticColor)
	}

	isBoardNtVFlipped.set(T)
	beatLevelCounter.set(beatLevelDelay) //wait 5 mins
	gameMenuWinChance.pEdit(50).add()
	winbarPos.pEdit(50).add()

	alpha35.alpha(.35)
	alpha60.alpha(.6)

	codeScroll.toggle_off()
	code.toggle_off()
	gameMenu.toggle_off()
	editMenu.toggle_off()

	for (let color of colorsIter) {
		for (let playerType of playerTypesIter) {
			if (playerType != HUMAN_PLAYER) {
				customGamePlayers[color][playerType].toggle_off()
			}
		}
	}

	UIPointerBoard.toggle_off()

	for (let fmts of [mainMenuArrows, editMenuArrows]) {
		for (let i in fmts) {
			if (i > 0) {
				fmts[i].toggle_off()
			}
		}
	}

	let shownSign = flr(Math.log10(beatLevelDelay))
	for (let fmtI in mainMenuBeatLevelSigns) {
		if (+fmtI != shownSign) {
			mainMenuBeatLevelSigns[fmtI].toggle_off()
		}
	}

	blindfoldedConfigs[1].toggle_off()
	gap()

	targetPosReset.call().add()
	cleanBoardEffects.call().add()
	
	for (let color of colorsIter) {
		boardKingChecks[color].toggle_off()
		boardKings[color].follow(boardKingCursors[color], 1, 1, -1)
	}
})

initializeRender.ext(() => {
	//fallback in case initialize fails
	isInitialized.if_is(EQUAL_TO, F, initialize)

	gap()
	startbgRainbow()
	guided.alpha(1)
})

//outside intialize in case initialize fails because a bug {
	alpha0.alpha(0)

	opts = options()
	"HIDE_GROUND HIDE_MG HIDE_P1 HIDE_P2 HIDE_ATTEMPTS add".split(" ")
		.forEach(call => opts[call]())
//}

initialize
	.call()
	.with("EDITOR_DISABLE", T)
	.add()

//random number from 0 to 64 (exclusive)
RNG_FACTOR = 64
rng.ext(() => {
	rngResult.pEdit(0).add()

	gap()
	for (let i of range(1, 13)) {
		random(
			fn(() => {
				rngResult.pEdit(pADD(rngResult, RNG_FACTOR / (2 ** i))).add()
			}),
			group(0),
			50, // 1/1 chance
		)
	}
})