castlingsIter = [
	LONG_CASTLE = 0,
	SHORT_CASTLE = 1,
]
FULL_CASTLE = 2

castleCheckPoss = [
	[57, 58, 59], //long
	[61, 62], //short
]

castleAnabolism = [-2, -3]

castleNoRayChecks = repeat(3, () => [[], []])
castleNoRayChecksPieces = [til.p, til.n]

for (let castle of [LONG_CASTLE, SHORT_CASTLE, FULL_CASTLE]) {
	for (let pieceI in castleNoRayChecksPieces) {
		castleNoRayChecks[castle][pieceI] =
			noRayFrom(
				noRayMoves[castleNoRayChecksPieces[pieceI]],
				initKingPos[WHITE] + [-1, 1, 0][castle],
			)
	}
}

fullCastleCheck = () => {
	fullCastleChecked.set(FULL_CASTLE_CHECKED_TRUE)
	nodeA.src.set(initKingPos[WHITE])
	gap()

	let rayChecks = [ //ray, dir, chunk
		[til.B, RAY_BACKWARD, RAY_NWSE      , 4],
		[til.B, RAY_BACKWARD, RAY_NESW      , 3],
		[til.R, RAY_BACKWARD, RAY_VERTICAL  , 4],
		[til.R, RAY_BACKWARD, RAY_HORIZONTAL, 7],
		[til.R, RAY_FOWARD  , RAY_HORIZONTAL, 7],
	]
	
	for (let rayCheck of rayChecks) {
		shotRay[RAY_CHECK][rayCheck[1]][rayCheck[2]][rayCheck[3]].call().add()
		gap()

		nodeA.pieMem[1].if_is(EQUAL_TO, til.Q, decabolismCallback)
		nodeA.pieMem[1].if_is(EQUAL_TO, rayCheck[0], decabolismCallback)
		gap()
	}

	for (let piece in castleNoRayChecksPieces) {
		for (let checkPos of castleNoRayChecks[FULL_CASTLE][piece]) {
			nodeA.tiles[checkPos].if_is(EQUAL_TO, flipColor(castleNoRayChecksPieces[piece]), decabolismCallback)
		}
	}
	gap()

	fullCastleChecked.set(FULL_CASTLE_CHECKED_FALSE)
}

castlingBasicCheck = (castle /*0 long, 1 short*/, payload) => {
	let checkPoss = castleCheckPoss[castle]

	nodeA.castling[castle].if_is(EQUAL_TO, F, ...payload)

	for (checkI in checkPoss) {
		let checkPos = checkPoss[checkI]

		for (let comp of [LARGER_THAN, SMALLER_THAN]) {
			nodeA.tiles[checkPos].if_is(comp, til._, ...payload)
		}
	}
}

checkCastle = (castle /*0 long, 1 short*/) => fn((now) => {
	let
		unvalidPayload = castle ? [decabolismCallback] : [now, false],
		castleSign = castle == LONG_CASTLE ? -1 : 1

	if (castle == LONG_CASTLE) {
		fullCastleChecked.set(FULL_CASTLE_CHECKED_UNDEFINED)
	} else if (castle == SHORT_CASTLE) {
		nodeA.src.set(64)
	}

	tmpC[1].add(1)
	nodeA.mov.add(1)
	gap()

	castlingBasicCheck(castle, unvalidPayload)
	gap()

	if (castle == LONG_CASTLE) {
		fullCastleCheck()
	} else {
		tmpG[1].toggle_on()
		tmpG[0].toggle_on()
		gap()

		//if last castle cloudnt check full castle, do it
		grouped(tmpG[0])
		castlingBasicCheck(LONG_CASTLE, [tmpG[0], false])
		gap()

		tmpG[1].toggle_off()
		grouped(tmpG[0])
		gap()

		grouped(tmpG[1])
		fullCastleCheck()
		grouped(tmpG[1])
	}
	gap()
	
	nodeA.src.set(initKingPos[WHITE] + castleSign)
	gap()

	let
		chunkOff = (castle == SHORT_CASTLE) * 2,
		rayChecks = [ //piece, ray, dir, chunk
			[til.B, RAY_BACKWARD, RAY_NWSE    , 3 + chunkOff],
			[til.B, RAY_BACKWARD, RAY_NESW    , 4 - chunkOff],
			[til.R, RAY_BACKWARD, RAY_VERTICAL, 3 + chunkOff],
		]

	for (let rayCheck of rayChecks) {
		shotRay[RAY_CHECK][rayCheck[1]][rayCheck[2]][rayCheck[3]].call().add()
		gap()

		for (let tile of [til.Q, rayCheck[0]]) {
			nodeA.pieMem[1].if_is(EQUAL_TO, tile, ...unvalidPayload)
		}
		gap()
	}
	
	for (let piece in castleNoRayChecksPieces) {
		for (let checkPos of castleNoRayChecks[castle][piece]) {
			nodeA.tiles[checkPos].if_is(EQUAL_TO, flipColor(castleNoRayChecksPieces[piece]), ...unvalidPayload)
		}
	}

	if (castle == LONG_CASTLE) {
		nodeA.src.set(64)
	}

	tmpC[1].add(-1)
	nodeA.mov.add(-1)
	specialAnabolism.set(castleAnabolism[castle])
	dst.set(initKingPos[WHITE] + castleSign * 2) //move king to the castle side
})

for (let color of colorsIter) {
	checkNode[color].ext(() => {
		nodeA.src.set(nodeA.kings[color])
		gap()

		updateSrcXY(nodeA.src)
		gap()

		let
			colorMap = color == WHITE ? flipColor : identity,
			rayMap = color == WHITE ? identity : noRayReverse,
			payload = checkNodePayloads[color]

		for (let ray of range(2)) {
			for (let dir of range(4)) {
				shotPointedRay(RAY_CHECK, ray, dir)
				gap()

				for (let tile of [til.q, dir < 2 ? til.b : til.r]) {
					nodeA.pieMem[1].if_is(EQUAL_TO, colorMap(tile), ...payload)
				}
				gap()
			}
		}

		nodeA.src.to_const_unorder(tilesIter, (king) => {
			for (let piece of [til.n, til.k, til.p]) {
				for (let checkPos of noRayFrom(rayMap(noRayMoves[piece]), king)) {
					nodeA.tiles[checkPos].if_is(EQUAL_TO, colorMap(piece), ...payload)
				}
			}
		})
	})
}