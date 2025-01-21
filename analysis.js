SIDE_BOARD_REFRESH_FREQUENCY = TICKS_A_SEC * (1 / 8) //8 a second

anabolismCallback = () => {
	nodeIdx.add(1)
	
	//if not in analysis mode, movegen is for UI
	engineOn.if_is(EQUAL_TO, F, movegenUICallback)
}

checkNodePayloads = [
	[fn(() => {
		nodeA.score.set(-MATE_RATE)
	})], //white
	[moveGenBreak, false], //black
]

updateGameMenuEngineStats = () => {
	gameMenuScore.pEdit(pDIV(nodes[0].score, PAWN_RATE)).add()
	gap()

	//https://lichess.org/page/accuracy
	//Win% = 50 + 50 * (2 / (1 + exp(-0.00368208 * centipawns)) - 1)
	tmpT[0].pEdit(pABS(pMUL(0.368208 * 0.5, gameMenuScore))).add()
	gap()

	constBasePow(gameMenuWinChance, Math.E, tmpT[0])
	gap()

	gameMenuWinChance.pEdit(pDIV(imm[1], gameMenuWinChance)).add()
	gap()

	gameMenuWinChance.pEdit(pADD(gameMenuWinChance, 1)).add()
	gap()

	gameMenuWinChance.pEdit(pDIV(imm[2], gameMenuWinChance)).add()
	gap()

	gameMenuWinChance.pEdit(pSUB(gameMenuWinChance, 1)).add()
	gap()

	gameMenuWinChance.pEdit(pMUL(50, gameMenuWinChance)).add()
	gap()

	pComp(
		gameMenuScore, LESS, 0,
		fn(() => {
			gameMenuWinChance.pEdit(pMUL(gameMenuWinChance, -1)).add()
		},
	)).add()
	gap()

	gameMenuWinChance.pEdit(pADD(gameMenuWinChance, 50)).add()
}

FULL_CASTLE_CHECKED_FALSE = 0
FULL_CASTLE_CHECKED_TRUE = 1
FULL_CASTLE_CHECKED_UNDEFINED = 2

decabolismCallback.ext(() => { //remap: nodeA nodeZ
	nodeA.score.if_is(EQUAL_TO, -inf, fn(() => {
		nodeA.score.set(0)
		gap()

		fullCastleChecked.if_is(EQUAL_TO, FULL_CASTLE_CHECKED_UNDEFINED, checkNode[WHITE])
		fullCastleChecked.if_is(EQUAL_TO, FULL_CASTLE_CHECKED_TRUE, checkNodePayloads[WHITE][0]) //is in check, its not stalemate
	}))
	gap()

	engineOn.if_is(EQUAL_TO, T, engineDecabolism)
	gap()

	nodeIdx.add(-1)
})

engineDecabolism.ext(() => {
	gameMenuNodes.add(1)

	nodeIdx.if_is(EQUAL_TO, 1, fn(() => {
		orderingRecordPush(
			newOrdererRecord,
			ordererFrom(
				thisMove,
				nodes[1].score,
				rootChildsCount,
			),
		)
		gap()
		
		rootChildsCount.add(1)
	}))
	gap()

	let isBetter = [pMUL(nodeA.score, -1), GREATER, nodeZ.score];

	pComp(
		...isBetter,
		fn(() => { //board is better
			nodeZ.score.pEdit(pMUL(nodeA.score, -1)).add()
			gap()

			//update alpha
			pComp(
				nodeZ.score, GREATER, nodeZ.alpha,
				fn(() => nodeZ.alpha.set(nodeZ.score)),
			).add()
			gap()

			//is improving root node?
			nodeIdx.if_is(EQUAL_TO, 1, fn(() => {
				copyInto(thisMove, depthMove)
			}))
		}),
	).add()
})

zobristCheck = (node) => {
	zobristHashMacro(node, turn, false)
	gap()

	zobristRecordMatchsMacro()
	gap()

	zobristRecordMatchsResult.if_is(LARGER_THAN, 1, fn(() => { //>= 2
		//if engine moves here again, this might be a tie, so assume
		//that if engine moves here it will be a tie
		node.score.set(0)
	}))
}

unorderedStep = (thisNode, childNode, parentNode) => {
	isFirstUnordered.if_is(EQUAL_TO, T, fn(() => {
		rootChildsCount.set(0)
		setMovegen(nodes[0])
	}))
	gap()

	copyInto(nodes[0], thisMove)
	gap()

	remapInto(
		moveGen,
		[nodeA, nodeB, nodeZ],
		[thisNode, childNode, parentNode],
	).call().add()
	gap()
	
	nodeIdx.if_is(EQUAL_TO, 1, fn(() => {
		//child of root node
		zobristCheck(childNode)
		gap()

		orderingMatchs(ordererRecord, rootChildsCount, tmpC[0])
		gap()

		//tmpC[0] is 0 if the move is ordered, so cancel node and nodeIdx stays in 0
		//tmpC[0] is 1 if the move is unordered, nodeIdx sets to 1 doing no effect
		nodeIdx.set(tmpC[0])
	}))
	isFirstUnordered.set(F)
}

orderedStep = (thisNode, childNode, parentNode) => {
	rootChildsCount.set(ordererRecord[0].moveCount)
	copyInto(objFilter(ordererRecord[0], movegenFilter), nodes[0])
	copyInto(ordererRecord[0], thisMove)
	gap()

	orderingShift(ordererRecord)
	ordererRecordLength.subtract(1)
	gap()

	remapInto(
		moveGen,
		[nodeA, nodeB, nodeZ],
		[thisNode, childNode, parentNode],
	).call().add()
	gap()
	
	nodeIdx.if_is(EQUAL_TO, 1, fn(() => {
		//child of root node
		zobristCheck(childNode)
	}))
	gap()
}

engineStep.ext(() => {
	engineStepBreak.toggle_on()
	gap()

	pComp(
		pADD(engineTurnedOnInTick, engineThinkTicks), LESS_OR_EQ, tickTimer,
		fn(() => {
			depth.if_is(LARGER_THAN, engineMinDepth, engineMove)
		})
	).add()
	gap()

	grouped(engineStepBreak)

	//this is the engine's search
	nodeIdx.to_const(range(engineMaxDepth).toReversed(), (conNodeIdx) => {
		let
			parentNode =
				conNodeIdx == 0 ?
					nodeZ :
					nodes[conNodeIdx - 1],
			thisNode = nodes[conNodeIdx],
			childNode = nodes[conNodeIdx + 1]

		let decabolism = () => {
			remapInto(rateBoard, nodeA, thisNode).call().add()
			gap()
	
			remapInto(
				decabolismCallback,
				[nodeA, nodeZ],
				[thisNode, parentNode],
			).call().add()
		}

		if (conNodeIdx == engineMaxDepth - 1) {
			decabolism()
		} else if (conNodeIdx == 0) {
			//root node

			let
				unorderedStepFn = fn(() => unorderedStep(thisNode, childNode, parentNode)),
				orderedStepFn = fn(() => orderedStep(thisNode, childNode, parentNode))

			pComp(
				ordererRecord[0].moveCount, EQ, NULL_ORDERER_MOVE_COUNT,
				unorderedStepFn,
				fn(() => {
					let isOrdererRecordEmpty = [ordererRecordLength, EQ, 0]

					pComp(
						...isOrdererRecordEmpty,
						unorderedStepFn,
						orderedStepFn,
					).add()
				}),
			).add()
		} else {
			let isLastDepth = [thisNode.depth, LESS_OR_EQ, 0]

			pComp(
				...isLastDepth,
				fn(decabolism), //cant advance, go back
				fn(() => {
					let alphaBetaCheck = [thisNode.alpha, GREATER_OR_EQ, pMUL(parentNode.alpha, -1)]
		
					pComp(
						...alphaBetaCheck,
						fn(() => { //alpha beta prune
							remapInto(
								decabolismCallback,
								[nodeA, nodeZ],
								[thisNode, parentNode],
							).call().add()
						}),
						fn(() => {
							remapInto(
								moveGen,
								[nodeA, nodeB, nodeZ],
								[thisNode, childNode, parentNode],
							).call().add()
						}),
					).add()
				}),
			).add()
		}

		gap()
		engineStepBreak.toggle_off()
	})

	grouped(engineStepBreak)
	gap()

	//finished root move
	nodeIdx.if_is(EQUAL_TO, -1, engineDepthDone)
})

engineReset = () => {
	updateGameMenuEngineStats()
	gap()
	
	setMovegen(nodes[0])
	setAnalyzer(nodes[0], depth)
	setAnalyzer(nodeZ)
	nodeIdx.set(0)
	rootChildsCount.set(0)
	ordererRecordLength.set(ordererRecord.length)

	copyInto(newOrdererRecord, ordererRecord)
	gap()

	newOrdererRecord.forEach(setOrdererNull)
}

engineDepthDone.ext(() => {
	gameMenuDepth.set(depth)
	
	gap()
	depth.add(1)
	copyInto(depthMove, bestMove)
	engineReset()
	
	gap()
	depth.if_is(LARGER_THAN, engineMaxDepth, engineMove)
})

turnOnHuman = () => {
	boardCursor.toggle_on()
	humanOn.set(T)
}

turnOnEngine = () => {
	gameMenuItems.forEach(x => x.set(0))
	engineTurnedOnInTick.set(tickTimer)
	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_FIND_VALIDS)

	sideBoardRefreshCountdown.set(0)
	depth.set(engineFirstDepth)
	engineOn.set(T)
	setMovegen(bestMove) //in case engine evals no move
	newOrdererRecord.forEach(setOrdererNull)
	isFirstUnordered.set(T)
	gap()

	engineReset()
	gap()

	rateInit.remap(neutralRemap).call().add()
}

engineMove.ext(() => {
	engineStepBreak.toggle_off()
	copyInto(bestMove, nodes[0])
	gap()

	remapInto(
		moveGen,
		[nodeA, nodeB],
		[nodes[0], nodes[1]],
	).call().with(...resetRemap).add()
	gap()

	gameTurn.call().add()
})

computerEngineStep.ext(() => {
	engineOn.if_is(EQUAL_TO, T, engineStep)
})

computerRandomerStep.ext(() => {
	randomerOn.if_is(EQUAL_TO, T, fn(() => {
		validDst.set(-1) //from movegenUICallback, will be setted to the destine tile, if move is valid
		gap()

		remapInto(
			moveGen,
			[nodeA, nodeB],
			[nodes[0], nodes[1]],
		).call().add()
		gap()

		validDst.if_is(LARGER_THAN, -1, fn(() => {
			randomerChoice.pEdit(pSUB(randomerChoice, 1)).add()
		}))
		gap()

		//found final move
		pComp(randomerChoice, LESS, -.5, gameTurn).add()
	}))
})

turnOnRandomer = () => {
	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_FIND_VALIDS)

	setMovegen(nodes[0])

	rng.call().add()
	randomerChoice.pEdit(pDIV(validMovesCount, RNG_FACTOR)).add()
	gap()
	
	randomerChoice.pEdit(pFLR(pMUL(rngResult, randomerChoice))).add()
	randomerOn.set(T)
}