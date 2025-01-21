//hash seed
zobristPiece = () => _crypto.randomBytes(32).readInt32BE(0, true)
zobristTable = repeat(64, () => repeat(tileCh.length, zobristPiece))
zobristEnPassant = repeat(8, zobristPiece) //one piece for every row
zobristCastling = repeat(nodeA.castling.length, zobristPiece)
zobristTurn = zobristPiece()

NULL_ZOBRIST_RECORD = 1

// check if en-passant is valid:
// 11011110 - step 1: column 3, (piece - whitePawn) 0: my pawn, 1: other
// \XXXXXX/ - step 2: nearest 2 neighbors AND (multiplication)
// 10101101 - valid en-passant pawns, 0: valid, 1: invalid
// 11111101 - step 3: 0: enpassant column, 1: not enpassant column
// |||||||| - step 4: OR (addition) bitmask
// 11111101 - if there is a 0 en-passant is valid

//hash a position
//this is not exactly zobrist but a homemade variant adapted to gd
zobristHashMacro = (node, turn, negateTurn = false) => {
	let
		checkBoard = tmpC.slice(0, 16),
		enPassantRow = node.tiles.slice(8 * 3, 8 * 4)
	
	//check if enpassant is valid
	
	//[11111111]
	//[????????]
	//step 1: bitboard with 0 as the tiles in the en-passant row that are enemy pawns
	for (let i in range(8)) {
		checkBoard[i].pEdit(pSUB(enPassantRow[i], imm[til.p])).add()
	}
	gap()

	//[?1????1?]
	//[?222222?]
	//step 2: nearest 2 neighbors AND (multiplication)
	for (let i of range(1, 7)) {
		let
			target = checkBoard[i + 8],
			prev = checkBoard[i - 1],
			next = checkBoard[i + 1]

		target.pEdit(pMUL(prev, next)).add()
	}
	gap()

	let
		nearNeigIdxs = [1, ...range(1 + 8, 7 + 8), 6],
		epRowIdxs = [0, ...range(2, 6), 7, 8, 15] //en-passant row

	//[31333313]
	//[32222223]
	//step 3: make en-passant row bitboard
	for (let i of range(8)) {
		let ep = checkBoard[epRowIdxs[i]]

		ep.pEdit(pSUB(node.enPassant, imm[i])).add()
	}
	gap()

	//[?4????4?]
	//[?444444?]
	//step 4: linear OR (addition) with enpassant row bitboard
	for (let i of range(8)) {
		let
			neig = checkBoard[nearNeigIdxs[i]],
			ep = checkBoard[epRowIdxs[i]]

		neig.add(ep)
	}

	zobristResult.set(0) //prepared to do a sum
	gap()

	for (let i of range(8)) {
		let neig = checkBoard[nearNeigIdxs[i]]

		neig.if_is(EQUAL_TO, 0, fn(() => {
			zobristResult.add(zobristEnPassant[i])
		}))
	}

	for (let castlingI in node.castling) {
		node.castling[castlingI].if_is(EQUAL_TO, T, fn(() => {
			zobristResult.add(zobristCastling[castlingI])
		}))
	}

	turn.if_is(EQUAL_TO, negateTurn ? WHITE : BLACK, fn(() => {
		zobristResult.add(zobristTurn)
	}))
	gap()

	for (let piece of piecesIter) {
		for (let zobristTmp of zobristTmps) {
			zobristTmp.toggle_on()
		}
		gap()

		for (let tileI of tilesIter) {
			let tile = node.tiles[tileI]

			tile.if_is(EQUAL_TO, piece, zobristTmps[tileI], false)
		}
		gap()

		for (let tileI of tilesIter) {
			grouped(zobristTmps[tileI])
			zobristResult.add(zobristTable[tileI][piece])
			grouped(zobristTmps[tileI])
		}
		gap()
	}
}

zobristHash.ext(() => zobristHashMacro(nodeA, turn))

zobristRecordReset.ext(() => {
	for (let record of zobristRecord) {
		record.set(NULL_ZOBRIST_RECORD)
	}
})

zobristRecordPush.ext(() => {
	for (let recordI of range(zobristRecord.length - 1).toReversed()) {
		zobristRecord[recordI + 1].set(zobristRecord[recordI])
		gap()
	}
	zobristRecord[0].set(zobristResult)
})

//sets zobristRecordMatchsResult to the amount of times zobristResult is present in zobristRecord
zobristRecordMatchsMacro = () => {
	let tmp = tmpC[0]

	zobristRecordMatchsResult.set(zobristRecord.length)
	gap()

	for (let record of zobristRecord) {
		tmp.pEdit(pSUB(record, zobristResult)).add()
		gap()

		zobristRecordMatchsResult.pEdit(pSUB(zobristRecordMatchsResult, pBIN(tmp))).add()
		gap()
	}
}

zobristRecordMatchs.ext(() => zobristRecordMatchsMacro())