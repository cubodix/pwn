MAX_PHASE = 24
MAX_HALF_PHASE = MAX_PHASE / 2

evalGamePhase = (mgScore, egScore, mgColorScores, egColorScores) => {
	for (let mgColorScore of mgColorScores) {
		mgColorScore.set(0)
	}
	gap()
	
	for (let color of colorsIter) {
		for (let piece in pestoGamephaseInc) {
			let
				gamephaseInc = pestoGamephaseInc[piece],
				mgColorScore = mgColorScores[color],
				colorPiece = pieceIntoColor[color](piece)

			mgColorScore.add(gamephaseInc * 64)
			for (let gamePhaseTmp of gamePhaseTmps) {
				gamePhaseTmp.toggle_on()
			}
			gap()

			for (let tileI of tilesIter) {
				let pieceToCheck = nodes[0].tiles[tileI]

				pieceToCheck.if_is(EQUAL_TO, colorPiece, gamePhaseTmps[tileI], false)
			}
			gap()

			for (let tileI of tilesIter) {
				let gamePhaseTmp = gamePhaseTmps[tileI]

				grouped(gamePhaseTmp)
				mgColorScore.subtract(gamephaseInc)
				grouped(gamePhaseTmp)
			}
			gap()
		}
	}
	gap()

	for (let mgColorScore of mgColorScores) {
		mgColorScore.if_is(LARGER_THAN, MAX_HALF_PHASE, fn(() => { //clamp gamephase
			mgColorScore.set(MAX_HALF_PHASE)
		}))
	}
	gap()

	mgScore.pEdit(pADD(...mgColorScores)).add()
	for (let colorScoreI in mgColorScores) {
		let
			mgColorScore = mgColorScores[colorScoreI],
			egColorScore = egColorScores[colorScoreI]
		
		egColorScore.pEdit(pSUB(imm[MAX_HALF_PHASE], mgColorScore)).add()
	}
	gap()

	egScore.pEdit(pSUB(imm[MAX_PHASE], mgScore)).add()
}

evalKingsXY = (kingsXY) => {
	for (let color of colorsIter) {
		let
			x = kingsXY[color][0],
			y = kingsXY[color][1],
			king = nodes[0].kings[color]

		y.pEdit(pDIV(king, 8)).add()
		constDivModule(x, king, 8)
	}
}

putValueTable = (cb) => {
	for (let piece of nonVoidPiecesIter) {
		for (let tile of tilesIter) {
			let wValue = weighedPestoTable[nonVoidIdx(piece)][tile]

			//processing this value is not necessary
			if (wValue === undefined) {
				continue
			}

			cb(wValue, tile, piece)
		}
	}
}

putPestoValues = (mgScore, egScore) => {
	//wValue = (phase * mgPestoValue + (MAX_PHASE - phase) * egPestoValue) / maxPhase
	let steps = [
		(wValue, mgScore, _egScore, mgPestoValue, _egPestoValue) =>
			wValue.pEdit(pMUL(mgScore, mgPestoValue)).add(),
		(wValue, _mgScore, egScore, _mgPestoValue, egPestoValue) =>
			wValue.pEdit(pADD(wValue, pMUL(egScore, egPestoValue))).add(),
		(wValue, _mgScore, _egScore, _mgPestoValue, _egPestoValue) =>
			wValue.pEdit(pDIV(wValue, MAX_PHASE)).add(),
	]

	for (let step of steps) {
		for (let piece of nonVoidPiecesIter) {
			for (let tile of tilesIter) {
				let
					p = pieceIntoWhite(piece),
					wValue = weighedPestoTable[nonVoidIdx(piece)][tile],
					mgTableValue = pestoTable[MIDDLE_GAME][p][tile],
					egTableValue = pestoTable[END_GAME][p][tile]
	
				//processing this value is not necessary
				if (wValue === undefined) {
					continue
				}
	
				assert(mgTableValue !== null && egTableValue !== null)
	
				let 
					mgPestoValue = mgTableValue + pestoValue[MIDDLE_GAME][p],
					egPestoValue = egTableValue + pestoValue[END_GAME][p]
	
				step(wValue, mgScore, egScore, mgPestoValue, egPestoValue)
			}
		}
		gap()
	}
}

EG_KING_SCORE_VALUE = 1

rateInit.ext(() => {
	let
		mgWScore = tmpC[0],
		mgBScore = tmpC[1],
		mgColorScores = [mgWScore, mgBScore],
		
		egWScore = tmpC[2],
		egBScore = tmpC[3],
		egColorScores = [egWScore, egBScore],

		mgScore = tmpC[4],
		egScore = tmpC[5],

		wkX = tmpC[6],
		wkY = tmpC[7],
		bkX = tmpC[8],
		bkY = tmpC[9],
		kingsXY = [[wkX, wkY], [bkX, bkY]], //[color][x: 0, y: 1]

		kingXDist = tmpC[10],
		kingYDist = tmpC[11],
		kingDists = [kingXDist, kingYDist],

		whiteEgExtraScore = tmpC[12],
		blackEgExtraScore = tmpC[13],
		colorEgExtraScores = [whiteEgExtraScore, blackEgExtraScore] //[color]

	evalGamePhase(mgScore, egScore, mgColorScores, egColorScores)
	evalKingsXY(kingsXY)
	gap()

	putPestoValues(mgScore, egScore)
	gap()

	putValueTable((wValue, rawTile, piece) => {
		let
			color = getPieceColor(piece),
			tile = color == WHITE ? rawTile : flipVPos(rawTile),
			tileXY = [tile % 8, flr(tile / 8)],
			pieceAsWhite = pieceIntoWhite(piece)

		//eval distance to king for endgames
		//14 - (abs(white_king_x - black_king_x) + abs(white_king_y - black_king_y))
		if (pieceAsWhite == til.k) {
			whiteEgExtraScore.set(0)
			blackEgExtraScore.set(14)

			for (let axis in kingDists) {
				blackEgExtraScore.pEdit(
					pSUB(
						blackEgExtraScore,
						pABS(
							pSUB(
								kingsXY[oppositeColor(color)][axis],
								imm[tileXY[axis]],
							)
						),
					)
				).add()
			}
		
			for (let blackKingAxis of kingsXY[oppositeColor(color)]) {
				whiteEgExtraScore.pEdit(pSUB(whiteEgExtraScore, pABS(pSUB(blackKingAxis, imm[3])))).add()
			}

			gap()
		
			for (let color of colorsIter) {
				wValue.pEdit(
					pADD(
						wValue,
						pMUL(
							pMUL(
								colorEgExtraScores[color],
								egColorScores[color == WHITE ? color : oppositeColor(color)],
							),
							EG_KING_SCORE_VALUE,
						),
					)
				).add()
			}
		}
	})
})

rateBoard.ext(() => { //remap: nodeA
	let score = nodeA.score
	score.set(0)
	gap()

	let
		isRefreshCountdownTriggered = [SMALLER_THAN, 1],
		triggerCountdown = fn(() => {
			gameMenuNodesPerSec.pEdit(pSUB(tickTimer, engineTurnedOnInTick)).add()
			gap()

			gameMenuNodesPerSec.pEdit(pMUL(pDIV(gameMenuNodes, gameMenuNodesPerSec), TICKS_A_SEC)).add()
			sideBoardRefreshCountdown.add(SIDE_BOARD_REFRESH_FREQUENCY)
			
			remapInto(
				refreshBoard,
				[displayPos, UIPieces, boardKingCursors, boardBlCorner, putBoardKingTile, putBoardTile],
				[nodeA, UISidePieces, sideKingCursors, sideBlCorner, putSideKingTile, putSideTile],
			).call().add()
		})

	sideBoardRefreshCountdown.if_is(
		...isRefreshCountdownTriggered,
		triggerCountdown,
	)

	let
		evalPiecesFromWeighedPestoTable = (isNodeSameColorAsRootNode) => {
			for (let piece of nonVoidPiecesIter) {
				for (let tile of tilesIter) { //tile to check
					let
						color = getPieceColor(piece),
						pScore = color == WHITE ? pADD : pSUB,
						rootColor = isNodeSameColorAsRootNode ^ (color == WHITE) ? color : oppositeColor(color),
						t = color == WHITE ? tile : flipVPos(tile),
						p = pieceIntoColor[rootColor](piece),
						weighedPestoValue = weighedPestoTable[nonVoidIdx(p)][t]
				
					if (weighedPestoValue === undefined) { //value doesn't exist
						continue
					}
				
					nodeA.tiles[tile].if_is(
						EQUAL_TO, piece,
						fn(() => {
							score.pEdit(pScore(score, weighedPestoValue)).add()
						}),
					)
				}
			}
		},
		isNodeNotSameColorAsRootNode = [pFLR(pDIV(nodeIdx, 2)), NOT_EQ, pDIV(nodeIdx, 2)]

	pComp(
		...isNodeNotSameColorAsRootNode,
		...boolIter.map(evalPiecesFromWeighedPestoTable),
	).add()
})