noRayMoves = Object.fromEntries([
	[til.k, [
		[-1, -1], [-1,  1],
		[-1,  0], [ 1, -1],
		[ 1,  1], [ 0, -1],
		[ 0,  1], [ 1,  0],
	]],
	[til.n, [
		[-2,  1], [-2, -1],
		[-1,  2], [-1, -2],
		[ 1,  2], [ 1, -2],
		[ 2,  1], [ 2, -1],
	]],
	[til.p, [
		[-1,  1], [-1, -1],
	]],
])

noRayReverse = (moves) =>
	moves.map(move => move.map(n => -n))

noRayFrom = (moves, src) =>
	moves.filter(move => {
		let
			dstY = flr(src / 8) + move[0],
			dstX = src % 8 + move[1]
		
		return dstY < 8 && dstY >= 0 && dstX < 8 && dstX >= 0
	}).map(move => src + move[0] * 8 + move[1])

noRayTableSort = (moveMap, table) =>
	moveMap.toSorted((a, b) => (table[b] ?? 0) - (table[a] ?? 0))

enPassantCheck = []

for (let destX of range(8)) {
	let enPassantMatchs = [nodeA.enPassant, EQ, destX]

	enPassantCheck.push(fn(() =>
		pComp(
			...enPassantMatchs,
			fn(() => specialAnabolism.set(destX)),
			fn(() => nodeA.mov.add(1)),
		).add()
	))
}

for (let isPromotion of range(2)) {
	for (let fn of noRayNextMovs[isPromotion]) {
		fn.ext(() => nodeA.mov.add(isPromotion ? 4 : 1))
	}
}

noRayMove = (piece, isCapture) => {
	nodeA.src.to_const_unorder(tilesIter, (src) => {
		let
			srcY = Math.floor(src / 8),
			isEnPassant = piece == til.p && srcY == 3,
			isPromotion = piece == til.p && srcY == 1,
			mappedMoves =
				noRayTableSort(
					noRayFrom(noRayMoves[piece], src),
					pestoTable[MIDDLE_GAME][piece],
				),
			movCheck = 0

		for (let destI in mappedMoves) {
			let
				dest = mappedMoves[destI],
				nextMov =
					isEnPassant ?
						undefined : //not needed in enpassant, a equivalent is included in enPassantCheck
						noRayNextMovs[+isPromotion][destI],
				check = isPromotion ?
					[movCheck ? LARGER_THAN : SMALLER_THAN, 4 - movCheck]:
					[EQUAL_TO, movCheck]

			nodeA.mov.if_is(...check, fn(() => {
				if (isPromotion) {
					srcT.pEdit(pSUB(imm[til.q + movCheck * 4], nodeA.mov)).add()
					wasPromotion.add(1)
					gap()
				}

				if (isCapture) {
					nodeA.tiles[dest].if_is(
						...isNotBlack,
						isEnPassant ?
							enPassantCheck[dest % 8]:
							nextMov,
					)
				} else {
					pComp(nodeA.tiles[dest], NOT_EQ, til._, nextMov).add()
				}
				gap()

				dst.set(dest)

				if (movCheck + 1 == mappedMoves.length) {
					nodeA.mov.if_is(...(isPromotion ? [EQUAL_TO, mappedMoves.length * 4 - 1] : check), softSrcBreakFn)
				}
			}))
			gap()

			++movCheck
		}

		nodeA.mov.if_is(
			EQUAL_TO,
			isPromotion ?
				mappedMoves.length * 4 :
				mappedMoves.length,
			srcBreak,
		)
	})
}

pawnQuietMove = () => {
	nodeA.src.to_const_unorder(range(8, 56), (src) => {
		let
			srcY = Math.floor(src / 8),
			isDouble = srcY == 6,
			isPromotion = srcY == 1
			
		pComp(nodeA.tiles[src - 8], NOT_EQ, til._, srcBreak).add() //if cant do the move break
		gap()

		dst.set(src - 8) //set destine

		if (isDouble) {
			gap()

			nodeA.mov.if_is(EQUAL_TO, 1, fn(() => {
				nodeB.enPassant.set(srcX)
				pComp(nodeA.tiles[src - 16], NOT_EQ, til._, srcBreak).add()
				dst.set(src - 16) //set destine
				gap()

				softSrcBreak()
			}))
		} else if (isPromotion) {
			srcT.pEdit(pSUB(imm[til.q], nodeA.mov)).add()
			gap()

			srcT.if_is(EQUAL_TO, til.n, softSrcBreakFn)
		} else {
			softSrcBreak()
		}
	})
}