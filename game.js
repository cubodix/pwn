FORCED_DRAW_REPETITIONS = 5

for (let color of colorsIter) {
	for (let side of colorsIter) {
		copyBoard[color][side].ext(() => {
			let
				pTileMap = side == WHITE ?
					color == WHITE ?
						(to, from) => to.set(from):
						runHPosFlip:
					color == WHITE ?
						runFPosFlip:
						runVPosFlip,
				tileVMap = side == WHITE ?
					identity :
					flipFPos,
				tileMap = color == WHITE ?
					tileVMap :
					i => flipHPos(tileVMap(i)),
				pieceMap = color == WHITE ?
					identity :
					pFlipColor

			for (let tile of tilesIter) {
				displayPos.tiles[tile].pEdit(pieceMap(nodes[0].tiles[tileMap(tile)])).add()
			}

			for (let color2 of colorsIter) {
				pTileMap(displayPos.kings[color2], nodes[0].kings[color ^ color2])
				gap()
			}
		})
	}
}

insufficientMaterialCheck.ext(() => {
	let
		colorPieces = [tmpC[0], tmpC[1]],
		minorColorPieces = [tmpC[2], tmpC[3]],
		counts = [
			//colorPieces
			{ //white
				counter: colorPieces[WHITE],
				checks: [isWhite],
			},
			{ //black
				counter: colorPieces[BLACK],
				checks: [isBlack],
			},

			//minorColorPieces
			{ //white
				counter: minorColorPieces[WHITE],
				checks: [[EQUAL_TO, til.n], [EQUAL_TO, til.b]],
			},
			{ //black
				counter: minorColorPieces[BLACK],
				checks: [[EQUAL_TO, til.N], [EQUAL_TO, til.B]],
			},
		]

	insufficientMaterialCheckResult.set(T) //if not stated otherwise, its a no mate material
	for (let count of counts) {
		count.counter.set(64)
	}
	gap()

	for (let count of counts) {
		for (let insufficientMaterialCheckTmp of insufficientMaterialCheckTmps) {
			insufficientMaterialCheckTmp.toggle_on()
		}
		gap()

		for (let tileI in nodes[0].tiles) {
			let tile = nodes[0].tiles[tileI]

			for (let check of count.checks) {
				tile.if_is(...check, insufficientMaterialCheckTmps[tileI], false)
			}
		}
		gap()

		for (let insufficientMaterialCheckTmpI in insufficientMaterialCheckTmps) {
			let insufficientMaterialCheckTmp = insufficientMaterialCheckTmps[insufficientMaterialCheckTmpI]

			grouped(insufficientMaterialCheckTmp)
			count.counter.subtract(1)
			grouped(insufficientMaterialCheckTmp)
		}
		gap()
	}
	gap()

	let nonMinorColorPieces = colorPieces

	for (let color of colorsIter) {
		nonMinorColorPieces[color].subtract(minorColorPieces[color])
	}
	gap()

	let sufficientMaterial = fn(() => {
		insufficientMaterialCheckResult.set(F)
	})

	for (let color of colorsIter) {
		nonMinorColorPieces[color].if_is(LARGER_THAN, 1, sufficientMaterial)
		minorColorPieces[color].if_is(LARGER_THAN, 1, sufficientMaterial)
	}
})

gameTurn.ext(() => {
	assert(HUMAN_PLAYER == 0)

	setCursorColor(WHITE)
	playerTypeToMove.set(playerType[WHITE])
	playerTypeToWait.set(playerType[BLACK])

	gameMenuMove.toggle_on()
	gameMenuPromotion.toggle_off()
	isCapturingMove.set(F)

	//fill the table with on
	for (let tile of tilesIter) {
		spacesInBoardTmps[tile].toggle_on()
	}
	gap()

	//turn off places in the table with spaces
	for (let tile of tilesIter) {
		nodes[0].tiles[tile].if_is(EQUAL_TO, til._, spacesInBoardTmps[tile], false)
	}

	turn.if_is(EQUAL_TO, BLACK, fn(() => {
		setCursorColor(BLACK)
		playerTypeToMove.set(playerType[BLACK])
		playerTypeToWait.set(playerType[WHITE])
	}))
	gap()

	//add how many non-spaces there was in this node
	for (let tile of tilesIter) {
		let g = spacesInBoardTmps[tile]
		grouped(g)
		isCapturingMove.add(1)
		grouped(g)
	}

	isPlayerToMoveAuto.pEdit(pBIN(playerTypeToMove)).add()
	isPlayerToWaitAuto.pEdit(pBIN(playerTypeToWait)).add()
	gameMenuWinChance.pEdit(pABS(pSUB(gameMenuWinChance, 100))).add()
	gap()

	//fill the table again
	for (let tile of tilesIter) {
		spacesInBoardTmps[tile].toggle_on()
	}

	let autoPlayersMatcher = tmpC[0]

	autoPlayersMatcher.set(isPlayerToWaitAuto)
	gap()

	//turn off places in the table with spaces
	for (let tile of tilesIter) {
		nodes[1].tiles[tile].if_is(EQUAL_TO, til._, spacesInBoardTmps[tile], false)
	}

	autoPlayersMatcher.pEdit(pADD(pMUL(isPlayerToMoveAuto, 2), autoPlayersMatcher)).add()
	gap()

	//subtract how many non-spaces there was in next node
	for (let tile of tilesIter) {
		let g = spacesInBoardTmps[tile]
		grouped(g)
		isCapturingMove.subtract(1)
		grouped(g)
	}

	//isCapturingMove is non-zero if the move takes a piece

	let boardRotations = [
		//isPlayerToMoveAuto, isPlayerToWaitAuto, vFlip
		[F, T, F   ],
		[F, F, F   ],
		[T, T, turn], //never rotate
		[T, F, T   ],
	]

	for (let boardRotation of boardRotations) {
		autoPlayersMatcher.if_is(EQUAL_TO, boardRotation[0] * 2 + boardRotation[1], fn(() => {
			isBoardNtVFlipped.set(boardRotation[2])
		}))
	}
	gap()

	isBoardHFlipped.pEdit(pSUB(isBoardNtVFlipped, turn)).add()
	gap()

	isBoardHFlipped.pEdit(pBIN(isBoardHFlipped)).add()
	gap()

	//copy next position here
	copyInto(objFilter(nodes[1], positionFilter), nodes[0])
	gap()

	nodes[0].score.set(0) //this will be setted to -MATE_RATE if king is in check with checkNode[WHITE]
	pComp(
		turn, EQ, WHITE,
		...colorsIter.map(
			(color) => fn(() => {
				fnToConst(isBoardNtVFlipped, copyBoard[color])
			}),
		),
	).add()
	gap()
	
	drawLastBoardTiles.call().add()
	gap()

	remapInto(
		checkNode[WHITE],
		[nodeA, nodeB],
		[nodes[0], nodes[1]],
	).call().add()
	gap()

	remapInto(
		clearBoard,
		[UIPieces, boardKingCursors],
		[UISidePieces, sideKingCursors],
	).call().add()

	for (let color of colorsIter) {
		boardKingChecks[color].toggle_off()
	}
	gap()

	refreshBoard.call().add()
	nodes[0].score.if_is(EQUAL_TO, -MATE_RATE, fn(() => { //king recieved check?
		for (let color of colorsIter) {
			turn.if_is(EQUAL_TO, color, boardKingChecks[color])
		}
	}))
	gap()

	boardCursor.toggle_off()
	for (let playerOn of [humanOn, engineOn, randomerOn]) {
		playerOn.set(F)
	}
	gap()

	//prepare legal moves check
	setMovegen(nodes[0])
	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_FIND_VALIDS)
	gap()

	remapInto(
		zobristHash,
		nodeA,
		nodes[0],
	).call().add()
	insufficientMaterialCheck.call().add()
	gap()

	//turn must be changed after zobristHash
	turn.pEdit(pSUB(imm[BLACK], turn)).add()

	zobristRecordPush.call().add()
	gap()

	zobristRecordMatchs.call().add()
	gap()

	validMovesCount.set(0)

	//you can tell by the second zobrist record if it is the first move
	//if it is the first move do start game sound
	let isTheFirstTurn = [zobristRecord[1], EQ, NULL_ZOBRIST_RECORD]

	pComp(
		...isTheFirstTurn,
		sfx.gameStart,
		fn(() => {
			pComp(
				isCapturingMove, EQ, F, //F if the move is not capture
				sfx.gameTurn,
				sfx.gameCapture,
			).add()
		}),
	).add()

	//if its a check do the sfx
	for (let color of colorsIter) {
		grouped(boardKingChecks[color])
		sfx.gameCheck.call().add()
		grouped(boardKingChecks[color])
	}

	//tick loop will call gameTurnEnd (or gameTerminate if the game ended) when it evals if there are any legal moves and position is not 5ft repeated
	checkingIfLegalMove.set(1)
})

//runs when tick loop ends up calculating if there are any legal moves
gameTurnEnd.ext(() => {
	let playerTypeToTurnOnPlayer =
		Object.fromEntries([
			[HUMAN_PLAYER, turnOnHuman],
			[ENGINE_PLAYER, turnOnEngine],
			[RANDOMER_PLAYER, turnOnRandomer],
		])

	checkingIfLegalMove.set(0)

	for (let playerType of playerTypesIter) {
		playerTypeToMove.if_is(
			EQUAL_TO, playerType,
			fn(playerTypeToTurnOnPlayer[playerType]),
		)
	}
})

//cloud be ran instead gameTurnEnd if game ended
gameTerminate.ext(() => {
	gameMenuGameResultOff.toggle_off()
	gameMenuGameResultOn.toggle_on()

	checkingIfLegalMove.set(0)
	sfx.gameEnd.call().add()

	let
		colorResults = [RESULT_WHITE_MATE, RESULT_BLACK_MATE].map((i) => gameMenuResults[i]),
		hasInsufficientMaterial = [insufficientMaterialCheckResult, EQ, T],
		isForcedDraw = [zobristRecordMatchsResult, EQ, FORCED_DRAW_REPETITIONS]

	pComp(
		...hasInsufficientMaterial,
		fn(() => {
			gameMenuResults[RESULT_NO_MATE_MATERIAL].toggle_on()
		}),
		fn(() => {
			pComp(
				...isForcedDraw,
				fn(() => {
					gameMenuResults[RESULT_5_REPETITION].toggle_on()
				}),
				fn(() => {
					nodes[0].score.if_is(LARGER_THAN, -MATE_RATE, gameMenuResults[RESULT_STALEMATE])
					for (let color of colorsIter) {
						turn.if_is(EQUAL_TO, color, colorResults[color])
					}
					gap()

					//is in check
					for (let color of colorsIter) {
						nodes[0].score.if_is(LARGER_THAN, -MATE_RATE, colorResults[color], false)
					}
				}),
			).add()
		}),
	).add()
	
	UIPointerMenu.toggle_on()
	UIPointerBoard.toggle_off()
})

gameStart.ext(() => {
	gameMenuGameResultOff.toggle_on()
	gameMenuGameResultOn.toggle_off()

	//avoid last move effect to take tiles in first turn
	turn.set(targetTurn)

	mainMenu.toggle_off()
	gameMenu.toggle_on()
	
	UIPointerMenu.toggle_off()
	UIPointerBoard.toggle_on()

	setMovegenNull(nodes[0])
	fromCursorIdx.set(-1)
	toCursorIdx.set(-1)

	zobristRecordReset.call().add()

	//hide result

	for (let gameMenuResult of gameMenuResults) {
		gameMenuResult.toggle_off()
	}

	//initialize user cursor
	cursorIdx.set(56)
	boardCursor.move_to(boardBlCorner)

	cleanBoardEffects.call().add()
	gap()

	gameTurn.call().add()
})

gameStartFromTarget.ext(() => {
	pComp(
		targetTurn, EQ, WHITE,
		fn(() => { //WHITE
			remapInto(gameStart, objFilter(nodes[1], positionFilter), targetPos).call().add()
		}),
		fn(() => { //BLACK
			//from targetPos create a contrary board and copy it into nodes[1], so gameStart catches it
			copyInvertedBoard(nodes[1], targetPos)
			gap()

			gameStart.call().add()
		}),
	).add()
})

gameQuit.ext(() => {
	for (let color of colorsIter) {
		boardKingChecks[color].toggle_off()
	}

	for (let gameMenuItem of gameMenuItems) {
		gameMenuItem.pEdit(gameMenuItem == gameMenuWinChance ? 50 : 0).add()
	}

	gameMenuGameResultOff.toggle_on()
	gameMenuGameResultOn.toggle_off()
	
	mainMenu.toggle_on()
	gameMenu.toggle_off()
	
	UIPointerMenu.toggle_on()
	UIPointerBoard.toggle_off()
	
	boardCursor.toggle_on()

	turn.set(WHITE)
	isBoardNtVFlipped.set(T)
	isBoardHFlipped.set(F)

	for (let playerOn of [humanOn, engineOn, randomerOn]) {
		playerOn.set(F)
	}
	
	checkingIfLegalMove.set(0)
	setMovegenNull(nodes[0])

	cleanBoardEffects.call().add()

	copyInto(targetPos, displayPos)
	gap()

	drawLastBoardTiles.call().add() //clear lastBoardTiles
	refreshBoard.call().add()
})