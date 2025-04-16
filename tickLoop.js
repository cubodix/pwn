let checkingIfLegalMoveStep = fn(() => {
	checkingIfLegalMove.if_is(EQUAL_TO, 1, fn(() => {
		nodeIdx.set(0) //detect if nodeIdx changed, if it changed (substracted by 1) then movegen decabolism was triggered
		validDst.set(-1) //will be >= 0 if move is valid
		gap()

		remapInto(
			moveGen,
			[nodeA, nodeB],
			[nodes[0], nodes[1]],
		).call().add()
		gap()

		//found all moves
		nodeIdx.if_is(EQUAL_TO, -1, fn(() => {
			let gameFinished = [validMovesCount, EQ, 0]

			pComp(
				...gameFinished,
				gameTerminate, //no moves, game ended
				fn(() => {
					checkingIfLegalMove.set(2) //wait 1 tick more to avoid remap problems
				})
			).add()
		}))

		zobristRecordMatchsResult.if_is(EQUAL_TO, FORCED_DRAW_REPETITIONS, gameTerminate)
		insufficientMaterialCheckResult.if_is(EQUAL_TO, T, gameTerminate)

		//move found
		validDst.if_is(LARGER_THAN, -1, fn(() => {
			validMovesCount.add(1)
		}))
	}))
})

let beatLevelCounterHandler = () => {
	//subtract 1 until its 0
	beatLevelCounter.pEdit(pSUB(beatLevelCounter, pBIN(beatLevelCounter))).add()
	gap()

	for (let base of range(0, 3)) {
		let
			breakPoint = 10 ** base - 1,
			thisSign = mainMenuBeatLevelSigns[base],
			nextSign = mainMenuBeatLevelSigns[base - 1],
			cond = [EQUAL_TO, breakPoint]

		beatLevelCounter.if_is(...cond, thisSign, false)

		if (nextSign !== undefined) {
			beatLevelCounter.if_is(...cond, nextSign)
		} else {
			beatLevelCounter.if_is(...cond, mainMenuBeatLevelCounter, false)
		}
	}
}

let theLoop = () => {
	tickTimer.add(1)
	sideBoardRefreshCountdown.subtract(1)

	for (let _ of range(engineStepsPerTick)) {
		computerEngineStep.remap(neutralRemap).call().add()
	}

	randomerOn.if_is(EQUAL_TO, T, computerRandomerStep)

	//last checking legal move tick
	checkingIfLegalMove.if_is(EQUAL_TO, 2, gameTurnEnd)
	gap()

	tickTimer.if_is(EQUAL_TO, RENDER_INITIALIZATION_DELAY + 1, initializeRender)
	
	//checking legal move tick
	for (let _ of range(engineStepsPerTick)) {
		checkingIfLegalMoveStep.remap(neutralRemap).call().add()
	}

	constDivModule(tmpC[0], tickTimer, TICKS_A_SEC * (1 / 60))
	gap()

	tmpC[0].if_is(EQUAL_TO, 0, winbarTick)
	gap()

	constDivModule(tmpC[0], tickTimer, TICKS_A_SEC)
	gap()

	tmpC[0].if_is(EQUAL_TO, 0, fn(beatLevelCounterHandler))
}

tickLoop(fn(theLoop))