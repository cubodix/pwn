showIfEvenOddIdx = [showIfEvenIdx, showIfOddIdx]

for (let evenOddI of [0 /*even*/, 1 /*odd*/]) {
	showIfEvenOddIdx[evenOddI].ext(() => {
		let
			cursorIdx = tmpC[0],
			cursor = tmpG[0]

		cursor.toggle_off()

		//tmpC[4] = cursor + cursorY
		//tmpC[3] -= flr(tmpC[4] / 2) * 2
		//tmpC[3] = tmpC[4] - tmpC[3]
		tmpC[4].set(cursorIdx)
		gap()

		tmpC[4].pEdit(pADD(tmpC[4], pDIV(tmpC[4], 8))).add()
		gap()

		tmpC[3].pEdit(pDIV(tmpC[4], 2)).add()
		gap()

		tmpC[3].pEdit(pMUL(tmpC[3], 2)).add()
		gap()

		tmpC[3].pEdit(pSUB(tmpC[4], tmpC[3])).add()
		gap()

		tmpC[3].if_is(EQUAL_TO, evenOddI, cursor)
	})
}

putBoardTileMacro = (tileSize = 1, target = tmpG[0], index = tmpC[0], indexCpy = tmpC[2]) => {
	indexCpy.set(index)
	target.move_to(boardBlCorner)
	gap()

	target.move(0, tileSize * 10 * 7)
	for (let cmp = 32; cmp >= 1; cmp /= 2) {
		gap()
		indexCpy.if_is(LARGER_THAN, cmp - 1, fn(() => {
			indexCpy.subtract(cmp)
			target.move(cmp % 8 * 10 * tileSize, flr(cmp / 8) * -10 * tileSize)
		}))
	}
}

let putTilesGen = [
	[putBoardTile, BOARD_TILE_SIZE],
	[putBoardKingTile, BOARD_TILE_SIZE], //exclusive to king to avoid remap problems
	[putSideTile, SIDE_TILE_SIZE],
	[putSideKingTile, SIDE_TILE_SIZE], //exclusive to king to avoid remap problems
]

for (let [fn, tileSize] of putTilesGen) {
	fn.ext(() => putBoardTileMacro(tileSize))
}

for (let ord of ordsIter) {
	for (let dst of tilesIter) {
		boardValids[ord][dst].ext(() => {
			toCursorIdx.if_is(EQUAL_TO, dst, toCursor, false)
			if (ord == ORD_PASSIVE) { //exclusive to passive ord, as you cant take VOID
				fromCursorIdx.if_is(EQUAL_TO, dst, fromCursor, false)
			}
		})
	}
}
	
MOVEGEN_UI_CALLBACK_DRAW_VALIDS = 0
MOVEGEN_UI_CALLBACK_FIND_VALIDS = 1

movegenUICallback.ext(() => {
	let isDrawingValids = [movegenUICallbackType, EQ, MOVEGEN_UI_CALLBACK_DRAW_VALIDS]

	pComp(
		...isDrawingValids,
		fn(() => {
			tmpC[0].pEdit(pMUL(nodeA.ord, 256)).add()
			gap()

			tmpC[0].add(dst)
			gap()

			tmpC[1].set(tmpC[0])
			gap()

			isBoardHFlipped.if_is(EQUAL_TO, T, fn(() => {
				runHPosFlip(tmpC[1], tmpC[0])
			}))
			gap()

			for (let ord of ordsIter) {
				for (let dst of tilesIter) {
					let matchVal = ord * 256 + dst

					tmpC[1].if_is(EQUAL_TO, matchVal, boardValids[ord][dst])
				}
			}
		}),
		fn(() => { //movegenUICallbackType == MOVEGEN_UI_CALLBACK_FIND_VALIDS
			validDst.set(dst)
		}),
	).add()
})

searchMove = (checkA, checkB, match = moveGen, keepCheckA, keepCheckB) => {
	let keepCheck = keepCheckA ? [keepCheckA, NOT_EQ, keepCheckB] : undefined

	for (let ord of ordsIter) {
		let
			markTimes = ord ?
				MAX_PASSIVE_MOVES_PER_PIECE:
				MAX_ACTIVE_MOVES_PER_PIECE,
			ordCheck = () => {
				setMovegen(nodes[0], selectedPiece, ord)
				gap()

				for (let _ in range(markTimes + +(keepCheck !== undefined))) { //additional mark check to determine if last move of the piece was done
					remapInto(
						fn(() => pComp(checkA, EQ, checkB, match).add()),
						[nodeA, nodeB],
						[nodes[0], nodes[1]],
					).call().add()
				}
			}

		if (keepCheck !== undefined && ord == ORD_PASSIVE) {
			pComp(...keepCheck, fn(ordCheck)).add()
		} else {
			ordCheck()
		}
		gap()
	}

	let castleCheck = () => {
		pComp(
			nodes[0].kings[0], EQ, selectedPiece,
			fn(() => {
				setMovegen(nodes[0], /*src 64 is castling*/ 64, 1)
				gap()

				//long castle
				remapInto(
					match,
					[nodeA, nodeB],
					[nodes[0], nodes[1]],
				).call().add()
				gap()

				//short castle
				nodes[0].src.if_is(EQUAL_TO, 64, fn(() => {
					remapInto(
						match,
						[nodeA, nodeB],
						[nodes[0], nodes[1]],
					).call().add()
				}))
			}),
		).add()
	}

	if (keepCheck) {
		pComp(...keepCheck, fn(castleCheck)).add()
	} else {
		castleCheck()
	}
}

drawBoardEffects.ext(() => {
	sfx.boardClick.call().add()

	let selectedCursors = [lightSelectedCursor, darkSelectedCursor]

	for (let evenOdd in selectedCursors) {
		let selectedCursor = selectedCursors[evenOdd]

		selectedCursor.move_to(boardCursor)
		
		remapInto(
			showIfEvenOddIdx[evenOdd % 2],
			[tmpG[0], tmpC[0]],
			[selectedCursor, cursorIdx],
		).call().with(...resetRemap).add()
	}

	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_DRAW_VALIDS)
	selectedPiece.set(targetCursorIdx)
	gap()

	searchMove(
		nodeA.src,
		targetCursorIdx,
	)
})
	
cleanBoardEffects.ext(() => {
	lightSelectedCursor.toggle_off()
	darkSelectedCursor.toggle_off()

	for (let tile of tilesIter) {
		for (let ord of ordsIter) {
			boardValids[ord][tile].toggle_off()
		}
	}
})

drawLastBoardTiles.ext(() => {
	toCursor.toggle_on()
	fromCursor.toggle_on()

	pComp(nodes[0].src, EQ, -1, //is first move (null movegen state)
		fn(() => lastMoveCursor.move(0, 10000)), //move cursor really far
		fn(() => {
			//if mov is 0 then the source tile was the previous one
			nodes[0].mov.if_is(EQUAL_TO, 0, fn(() => nodes[0].src.subtract(1)))
			gap()

			let lastMoveCursors = [
				fromDarkCursor,
				fromLightCursor,
				toDarkCursor,
				toLightCursor,
			]

			for (let lastMoveCursorI in lastMoveCursors) {
				let
					lastMoveCursor = lastMoveCursors[lastMoveCursorI],
					isToCursor = lastMoveCursorI >= 2,
					cursorIdx = isToCursor ? dst : nodes[0].src,
					newCursorIdx = isToCursor ? toCursorIdx : fromCursorIdx

				if (lastMoveCursorI == 0) { //first nodes[0].src check
					cursorIdx.if_is(EQUAL_TO, 64, fn(() => { //if src out of bounds its a castle
						cursorIdx.set(initKingPos[WHITE])
					}))
				}
				gap()

				newCursorIdx.set(cursorIdx) //value stays if not flip
				gap()

				isBoardNtVFlipped.if_is(EQUAL_TO, F, fn(() => {
					runVPosFlip(newCursorIdx, cursorIdx) //tmpC[0] is now flipped lastMoveCursor
				}))
				gap()

				tmpC[7].set(newCursorIdx)
				gap()

				isBoardHFlipped.if_is(EQUAL_TO, T, fn(() => {
					runHPosFlip(newCursorIdx, tmpC[7])
				}))
				gap()

				remapInto(
					putBoardTile,
					[tmpG[0], tmpC[0]],
					[lastMoveCursor, newCursorIdx],
				).call().with(...resetRemap).add()
				gap()

				remapInto(
					showIfEvenOddIdx[lastMoveCursorI % 2],
					[tmpG[0], tmpC[0]],
					[lastMoveCursor, newCursorIdx],
				).call().with(...resetRemap).add()
				gap()
			}
		}),
	).add()
})

clearBoard.ext(() => {
	for (let color of colorsIter) {
		boardKingCursors[color].toggle_off()
	}
	
	for (let tile of tilesIter) 
	for (let piece of nonVoidOrKingPiecesIter) {
		let UIPiece = UIPieces[tile][nonVoidOrKingIdx(piece)]

		if (UIPiece !== undefined) {
			UIPiece.toggle_off()
		}
	}
})

refreshBoard.ext(() => {
	clearBoard.call().add()

	//turn off all coords
	for (let color of colorsIter) {
		coords[color].toggle_off()
	}
	gap()

	//turn on the corresponding coords
	for (let color of colorsIter) {
		isBoardHFlipped.if_is(EQUAL_TO, color, coords[color])
	}

	for (let color of colorsIter) {
		//use different functions for iteration to avoid remap problems
		boardKingCursors[color].toggle_on()
		remapInto(
			color == WHITE ? putBoardTile : putBoardKingTile,
			[tmpG[0], tmpC[0]],
			[boardKingCursors[color], displayPos.kings[color]],
		).call().add()
		gap()
	}
	
	for (let tile of tilesIter) {
		for (let piece of nonVoidOrKingPiecesIter) {
			let UIPiece = UIPieces[tile][nonVoidOrKingIdx(piece)]
			
			if (UIPiece !== undefined) {
				displayPos.tiles[tile].if_is(EQUAL_TO, piece, UIPiece)
			}
		}
	}
})

menuShift = (menu, dir /*0 up, 1 down*/) => {
	let entries = range(menu.length)

	if (dir) {
		entries.reverse()
	}

	tmpG[0].toggle_off()
	gap()

	for (let entryI in entries) {
		let
			arrowI = entries[entryI],
			arrowNextI = entries[entryI - 1],
			arrow = menu[arrowI],
			arrowNext = menu[arrowNextI] ?? tmpG[0]

		grouped(arrow)
		arrowNext.toggle_on()
		gap()

		arrow.toggle_off()
		gap()
		grouped(arrow)
	}
	gap()

	grouped(tmpG[0])
	menu[entries[entries.length - 1]].toggle_on()
	grouped(tmpG[0])
}

targetPosReset.ext(() => {
	for (let editMenuSettingI in editMenuSettings) {
		let
			setting = editMenuSettings[editMenuSettingI],
			config = editMenuSettingConfigs[editMenuSettingI]
		
		for (let i in config) {
			config[i][setting.initDefault == i ? "toggle_on" : "toggle_off"]()
		}
	}

	targetTurn.set(initTurn)
	setPosition(targetPos, initPos)
	setPosition(displayPos, initPos)
	gap()

	refreshBoard.call().add()
})

selectPromotion.ext(() => {
	UIPointerMenu.toggle_on()
	UIPointerBoard.toggle_off()
	gameMenuPromotion.toggle_on()
	gameMenuMove.toggle_off()

	for (let i in gameMenuPromotionArrows) {
		let gameMenuPromotionArrow = gameMenuPromotionArrows[i]

		gameMenuPromotionArrow[i == 0 ? "toggle_on" : "toggle_off"]()
	}
})

WINBAR_TRANSITION_SPEED = 1 / 3

winbarTick.ext(() => {
	let
		winChanceTmp = tmpT[0],
		dynPolys = [dynLWinBarPoly, dynRWinBarPoly],
		basePolys = [baseLWinBarPoly, baseRWinBarPoly],
		precision = 10,
		max = (1 - 2 ** -precision) * 100 //max bar height possible with this precision

	setColorToStatic(COLOR_WINBAR_BASE, staticColors.COLOR_WHITE)
	setColorToStatic(COLOR_WINBAR_TOP, staticColors.COLOR_BLACK)
	winChanceTmp.pEdit(gameMenuWinChance).add()
	gap()

	pComp(
		isBoardNtVFlipped, EQ, turn,
		fn(() => {
			setColorToStatic(COLOR_WINBAR_BASE, staticColors.COLOR_BLACK)
			setColorToStatic(COLOR_WINBAR_TOP, staticColors.COLOR_WHITE)
		}),
	).add()

	//flip bar value if board is flipped
	isBoardNtVFlipped.if_is(EQUAL_TO, T, fn(() => {
		winChanceTmp.pEdit(pABS(pSUB(winChanceTmp, 100))).add()
	}))
	gap()
	
	//barPos = barPos + (winChance - barPos) * TRANSITION_SPEED
	//barPos = barPos * 1 + winChance * TRANSITION_SPEED - barPos * TRANSITION_SPEED
	//barPos = barPos * (1 - TRANSITION_SPEED) + winChance * TRANSITION_SPEED

	winbarPos.pEdit(pMUL(winbarPos, 1 - WINBAR_TRANSITION_SPEED)).add()
	gap()

	winbarPos.pEdit(pADD(winbarPos, pMUL(winChanceTmp, WINBAR_TRANSITION_SPEED))).add()
	gap()

	for (let polyI in dynPolys) {
		dynPolys[polyI].move_to(basePolys[polyI])
	}
	winChanceTmp.pEdit(winbarPos).add()
	gap()

	pComp(
		winbarPos, GREATER_OR_EQ, max,
		fn(() => {
			for (let dynPoly of dynPolys) {
				dynPoly.move(0, WINBAR_HEIGHT * 10)
			}
		}),
		fn(() => {
			for (let i of range(-precision, 0).toReversed()) {
				let v = 2 ** i
			
				pComp(
					winChanceTmp, GREATER_OR_EQ, v * 100,
					fn(() => {
						for (let dynPoly of dynPolys) {
							dynPoly.move(0, WINBAR_HEIGHT * v * 10)
						}
					
						if (i != -precision) { //last one doesn't need this
							winChanceTmp.pEdit(pSUB(winChanceTmp, v * 100)).add()
						}
					}),
				).add()
				gap()
			}
		}),
	).add()
})