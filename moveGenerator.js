srcBreak.ext(() => {
	nodeA.src.add(1)
	nodeA.mov.set(0)
	moveGenBreak.toggle_off()
})

softSrcBreak = () => {
	nodeA.mov.set(-1) //at the end of the move mov is added 1
	srcPost.add(1)
}

softSrcBreakFn.ext(softSrcBreak)

updateSrcXY = src => {
	srcY.pEdit(pDIV(src, 8)).add() //srcY = src / 8
	srcX.set(src) //srcX = src
	gap()

	srcX.pEdit(pSUB(srcX, pMUL(srcY, 8))).add() //srcX -= srcY * 8
}

require("./rayMoves")
require("./noRayMoves")
require("./moveValidator")

ORD_ACTIVE = 0
moveOrd0 = () => {
	srcT.to_const(colorPiecesIter[WHITE].toReversed(), tile => {
		if (tile > til.n) {
			captureRayMove(rayOrders[tile])
		} else {
			noRayMove(tile, true)
		}
	})
}

ORD_PASSIVE = 1
moveOrd1 = () => {
	//src = 64 and mov = 2
	//src + mov * 256 = 64 + 2 * 256
	//mov * 256 = 64 + 512 - src
	//mov * -256 = src - 576
	pComp(pMUL(nodeA.mov, -256), EQ, pSUB(nodeA.src, 576), decabolismCallback).add()
	gap()
	
	tmpC[1].set(nodeA.mov)
	movChu.pEdit(pDIV(nodeA.mov, 7)).add() //movChu = mov / 7
	movOff.set(nodeA.mov) //movOff = mov
	gap()

	tmpC[1].pEdit(pADD(pMUL(nodeA.src, 256), tmpC[1])).add()
	movOff.pEdit(pSUB(movOff, pMUL(movChu, 7))).add() //movOff -= movChu * 7
	gap()

	for (let castle of castlingsIter) {
		tmpC[1].if_is(EQUAL_TO, 256 * 64 + (castle == SHORT_CASTLE), checkCastle(castle))
		gap()
	}

	srcT.to_const(colorPiecesIter[WHITE].toReversed(), tile => {
		if (tile == til.p) {
			pawnQuietMove()
		} else if (tile == til.k || tile == til.n) {
			noRayMove(tile, false)
		} else {
			quietRayMove(rayOrders[tile])
		}
	})
}

ordsIter = [ORD_ACTIVE, ORD_PASSIVE]

anabolism = () => {
	//general anabolism

	srcT.if_is( //if srcT is _ its castling
		EQUAL_TO, til._,
		fn(() => {
			srcT.set(til.k)
		}),
	)

	for (let tileI in nodeA.tiles) { //tilesB = tilesA
		nodeB.tiles[flipVPos(tileI)].pEdit(pFlipColor(nodeA.tiles[tileI])).add()
	}
	gap()

	dst.to_const_unorder(tilesIter, tileI => { //tilesB[dst] = srcT
		nodeB.tiles[flipVPos(tileI)].pEdit(pFlipColor(srcT)).add()
	})
	gap()

	nodeA.src.to_const_unorder(tilesIter, tileI => { //tilesB[src] = VOID
		nodeB.tiles[flipVPos(tileI)].set(til._)
	})

	for (let castlingI in nodeA.castling) {
		nodeB.castling[(+castlingI + 2) % 4].set(nodeA.castling[castlingI])
	}
	gap()

	//special anabolism

	specialAnabolism.to_const_unorder(range(8), specialAnabolism => {
		nodeB.tiles[flipVPos(8 * 3 + specialAnabolism)].set(flipColor(til._))
	})
	gap()

	for (let corner = 0; corner < 4; ++corner) {
		for (let check = 0; check < 2; ++check) {
			tmpC[check].pEdit(pSUB(check ? dst : nodeA.src, imm[[0, 7, 56, 63][corner]])).add()
		}
		gap()
		
		let castling = nodeB.castling[corner]
		for (let check = 0; check < 2; ++check) {
			castling.pEdit(pMUL(castling, pBIN(tmpC[check]))).add()
		}
		gap()
	}

	//metadata anabolism

	for (let kingI in nodeA.kings) {
		runVPosFlip(nodeB.kings[1 - kingI], nodeA.kings[kingI])
	}
	gap()

	for (let castle of castlingsIter) {
		let castleSign = castle == LONG_CASTLE ? -1 : 1

		specialAnabolism.if_is(
			EQUAL_TO, castleAnabolism[castle],
			fn(() => {
				let putTiles = [
					[til._, 0],
					[til.r, 1],
					[til._, 3 + (castle == LONG_CASTLE)],
				]

				for (let [piece, off] of putTiles) {
					nodeB.tiles[flipVPos(initKingPos[WHITE] + castleSign * off)].set(flipColor(piece))
				}
			
				nodeB.kings[BLACK].set(flipVPos(initKingPos[WHITE] + castleSign * 2))

				for (let castle of castlingsIter) {
					nodeB.castling[BLACK * 2 + castle].set(F)
				}
			}),
		)
	}
	gap()

	srcT.if_is(EQUAL_TO, til.k, fn(() => {
		runVPosFlip(nodeB.kings[BLACK], dst)
		for (let castle of castlingsIter) {
			nodeB.castling[BLACK * 2 + castle].set(F)
		}
	}))

	nodeA.mov.add(1)
	nodeA.src.set(srcPost)
	nodeB.score.set(-inf)
	gap()

	remapInto(checkNode[BLACK], nodeA, nodeB).call().add()
	gap()

	nodeB.src.set(0)
	nodeB.mov.set(0)
	nodeB.ord.set(ORD_ACTIVE)
	nodeB.fst.set(-1)
	nodeCount.add(1)
	
	//update analyzer
	nodeB.alpha.pEdit(nodeZ.alpha).add()
	nodeB.depth.pEdit(pSUB(nodeA.depth, imm[1])).add()
	gap()

	//callback anabolism
	anabolismCallback()
}

decabolismCallback.ext(() => {
	moveGenBreak.toggle_off()
})

moveGen.ext(() => {
	moveGenBreak.toggle_on()
	gap()

	grouped(moveGenBreak)

	oldOrd.set(nodeA.ord)

	nodeA.src.to_const(tilesIter, (tileI) => { //search next own piece
		nodeA.tiles[tileI].if_is(
			...isNotWhite,
			fn(() => {
				nodeA.src.add(1)
			}),
		)
	})
	gap()

	//ord = 0 and src = 64
	//ord * 256 + src = 64
	//ord * 256 = 64 - src
	//ord * -256 = src - 64
	pComp(pMUL(nodeA.ord, -256), EQ, pSUB(nodeA.src, 64), fn(() => {
		nodeA.ord.add(1)
		nodeA.src.set(nodeA.fst)
	})).add()
	gap()

	srcT.set(til._) //will remain void if move is castling

	let isFirstMove = [EQUAL_TO, -1]

	nodeA.fst.if_is(
		...isFirstMove,
		fn(() => nodeA.fst.set(nodeA.src)),
	)
	gap()

	srcPost.set(nodeA.src)
	nodeB.enPassant.set(8)
	specialAnabolism.set(-1)
	nodeA.src.to_const_unorder(tilesIter, (tileI) => srcT.set(nodeA.tiles[tileI])) //srcT = tiles[src]
	updateSrcXY(nodeA.src)
	gap()

	let isOrdActive = [nodeA.ord, EQ, ORD_ACTIVE]

	pComp(
		...isOrdActive,
		...[moveOrd0, moveOrd1].map(fn),
	).add()
	gap()

	anabolism() //build next board

	grouped(moveGenBreak)
})