colorsIter = [
	WHITE = 0,
	BLACK = 1,
]

NO_ENPASSANT = 8

//the "initial board"
initTurn = WHITE
initPos = {
	tiles: "\
		R N B Q K B N R\
		P P P P P P P P\
		- - - - - - - -\
		- - - - - - - -\
		- - - - - - - -\
		- - - - - - - -\
		p p p p p p p p\
		r n b q k b n r\
	",
	castling: [T, T, T, T],
	enPassant: NO_ENPASSANT,
}

//this MUST be the actual initial position, needed for 324 mode
ogTurn = WHITE
ogPos = {
	tiles: "\
		R N B Q K B N R\
		P P P P P P P P\
		- - - - - - - -\
		- - - - - - - -\
		- - - - - - - -\
		- - - - - - - -\
		p p p p p p p p\
		r n b q k b n r\
	",
	castling: [T, T, T, T],
	enPassant: NO_ENPASSANT,
}

tileCh = "pknbrq-QRBNKP"

til = {}
for (let idx in tileCh) {
	til[tileCh[idx] == "-" ? "_" : tileCh[idx]] = +idx
}

playerTypesIter = [
	HUMAN_PLAYER = 0,
	ENGINE_PLAYER = 1,
	RANDOMER_PLAYER = 2,
]

tilesIter = range(64)

//facts
initKingPos = [60, 4] //[color]
MAX_PASSIVE_MOVES_PER_PIECE = 41
MAX_PASSIVE_NO_RAY_MOVES_PER_PIECE = 8
MAX_PROMOTIONS_PER_PIECE = 3
MAX_ACTIVE_MOVES_PER_PIECE = 8

isPieceWhite = n => n < til._
isPieceBlack = n => n > til._
getPieceColor = n => isPieceWhite(n) ? WHITE : BLACK
oppositeColor = n => n == WHITE ? BLACK : WHITE

flipColor = n => tileCh.length - 1 - n
pieceIntoWhite = n => isPieceBlack(n) ? flipColor(n) : n
pieceIntoBlack = n => isPieceWhite(n) ? flipColor(n) : n
pieceIntoColor = [pieceIntoWhite, pieceIntoBlack]

flipVPos = n => n ^ 56
flipHPos = n => n ^ 7
flipFPos = n => flipVPos(flipHPos(n))

pFlipColor = n => pSUB(imm[tileCh.length - 1], n)

runVPosFlip = (to, from) => { //vertival position flip
	//(7 - fromY) * 8 + (from - fromY * 8)
	//(7 - fromY) * 8 - fromY * 8 + from
	//(7 - fromY * 2) * 8 + from
	//56 - fromY * 16 + from
	//abs(fromY * 16 - from - 56)
	to.set(16)
	gap()

	to.pEdit(pMUL(to, pFLR(pDIV(from, 8)))).add()
	gap()

	to.pEdit(pABS(pSUB(to, pADD(from, imm[56])))).add()
}

runHPosFlip = (to, from, tmp = tmpC[6]) => { //horizontal position flip
	//(7 - fromX) + (from - fromX)
	//7 - fromX + from - fromX
	//from - fromX * 2 + 7

	constDivModule(tmp, from, 8) //tmp = fromX
	gap()

	to.pEdit(pADD(from, imm[7])).add()
	gap()

	to.pEdit(pSUB(to, pMUL(tmp, 2))).add()
}

runFPosFlip = (to, from) => { //full position flip
	to.pEdit(pMUL(from, -1)).add()
	gap()

	to.add(63)
}

copyInvertedBoard = (toPos, fromPos) => {
	toPos.enPassant.set(fromPos.enPassant)

	for (let i of tilesIter) {
		toPos.tiles[i].pEdit(pFlipColor(fromPos.tiles[flipVPos(i)])).add()
	}

	for (let color of colorsIter) {
		runVPosFlip(toPos.kings[color], fromPos.kings[oppositeColor(color)])
		for (let castle of castlingsIter) {
			toPos.castling[color * 2 + castle].set(fromPos.castling[(oppositeColor(color)) * 2 + castle])
		}
	}
}

isBlack = [LARGER_THAN, til._]
isNotBlack = [SMALLER_THAN, til.Q]
isWhite = [SMALLER_THAN, til._]
isNotWhite = [LARGER_THAN, til.q]

colorPiecesIter = [
	range(til.p, til.q + 1), //white
	range(til.Q, til.P + 1), //black
]

nonVoidPiecesIter = [...colorPiecesIter[WHITE], ...colorPiecesIter[BLACK]]

piecesIter = [...nonVoidPiecesIter, til._]

nonVoidOrKingPiecesIter = nonVoidPiecesIter.filter(p => p != til.k && p != til.K)

nonVoidIdx =
	(piece) => piece
	- (piece > til._)

nonVoidOrKingIdx =
	(piece) => piece
	- (piece > til._)
	- (piece > til.k)
	- (piece > til.K)

//represents the state of the movegen, it should be used
//along a position to generate new positions
newMovegen = () => ({
	//the piece the movegen is looking at
	src: counter(),

	//the move of the piece the movegen is looking at
	mov: counter(),

	//in which phase is the movegen, ACTIVE | PASSIVE
	ord: counter(),

	//where is the first white piece, this saves a tick
	//when ord changes from ACTIVE to PASSIVE, the
	//movegen doesn't need to find the first piece again
	fst: counter(),

	//miscellaneous memory that is assigned to the
	//piece the movegen is looking at, now it's
	//only used in raypieces
	pieMem: repeat(2, counter),
})

movegenFilter = "src mov ord fst pieMem".split(" ")

setMovegen = (movegen, src = 0, ord = 0) => {
	movegen.src.set(src)
	movegen.mov.set(0)
	movegen.ord.set(ord)
	movegen.fst.set(-1)
	movegen.pieMem[0].set(0)
	movegen.pieMem[1].set(0)
}

setMovegenNull = (movegen) => {
	movegen.src.set(-1)
}

assert(NO_ENPASSANT == 8)

//this represents a position, it has redundant information (kings)
//so the engine can think faster
newPosition = () => ({
	tiles: repeat(64, counter), //pieces in the board
	castling: repeat(4, counter), //[white long, white short, black long, black short] castling rights
	enPassant: counter(), //column where a enpassant can happend, none is 8
	kings: repeat(2, counter), //[white, white], king's positions
})

positionFilter = "tiles castling enPassant kings".split(" ")

boardFromPosObj = (obj) => {
	let out = {
		kings: repeat(2, () => undefined),
		tiles: repeat(64, () => undefined),
		tileIdx: 0,
	}

	for (let ch of obj.tiles) {
		let tile = tileCh.indexOf(ch)

		if (tile == til.k || tile == til.K) {
			out.kings[+(tile == til.K)] = out.tileIdx
		}

		if (tile != -1) {
			out.tiles[out.tileIdx++] = tile
		}
	}

	return out
}

setPosition = (pos, obj) => {
	pos.enPassant.set(obj.enPassant)

	let boardFromPos = boardFromPosObj(obj)

	for (let tileI in pos.tiles) {
		pos.tiles[tileI].set(boardFromPos.tiles[tileI])
	}

	for (let kingI in pos.kings) {
		pos.kings[kingI].set(boardFromPos.kings[kingI])
	}

	for (let castlingI in pos.castling) {
		pos.castling[castlingI].set(obj.castling[castlingI])
	}

	assert(boardFromPos.tileIdx == 64)
}

//state exclusive to nodes that the engine needs to analyze
newAnalyzer = () => ({
	//score represents "how well" a node did
	score: counter(),
	
	//alpha is a
	//additional value used to speed up the search
	//thanks to the alpha-beta algorithm
	alpha: counter(),

	//how many depth is the program supposed to look
	//from this node to his childs
	depth: counter(),
})

analyzerFilter = "score alpha".split(" ")

setAnalyzer = (analyzer, depth = undefined) => {
	analyzer.score.set(-inf)
	analyzer.alpha.set(-inf)

	if (depth !== undefined) {
		analyzer.depth.set(depth)
	}
}

//a node represents a board in the engine analysis
//it includes a position, a movegen and a analyzer
newNode = () => ({
	...newPosition(),
	...newMovegen(),
	...newAnalyzer(),
})

printNode = (node, posX, posY, margin = 10, scale = 0.2) => {
	let
		displayObj = (obj, off) => mapObj(obj, ([k, v]) => [off + +k, v]),
		display = {
			...displayObj(node.pieMem, -24),
			...displayObj(node.kings, -22),

			"-16": node.src,
			"-15": node.mov,
			"-14": node.ord,
			"-13": node.fst,
			"-9": node.score,

			"-17": node.alpha,

			...displayObj(node.castling, -8),

			"-1": node.enPassant,
			...node.tiles,
		}

	for (let i in display) { //build num board
		display[+i].to_obj()
			.with("X", (+i - Math.floor(+i / 8) * 8) * margin + posX)
			.with("Y", margin * 7 - Math.floor(+i / 8) * margin + posY)
			.with("SCALING", scale)
			.with("COLOR", COLOR_WHITE)
			.add()
	}
}

//saves the result of analysing a child of root node
//so it can be used later to do move-ordering
newOrderer = () => ({
	//state of movegen before the generation
	//of this position
	...newMovegen(),

	//how many the registered position scored
	score: counter(),

	//moveCount is used to easily identify when
	//two moves are the same, used to check
	//if a orderer is in a list
	moveCount: counter(),
})

NULL_ORDERER_MOVE_COUNT = -1

setOrdererNull = (orderer) => {
	orderer.score.set(2 ** 31 - 1)
	orderer.moveCount.set(NULL_ORDERER_MOVE_COUNT)
}

ordererFrom = (movegen, score, moveCount) => ({
	...objFilter(movegen, ordererFilter),
	score: score,
	moveCount: moveCount,
})

ordererFilter = [
	...movegenFilter,
	..."moveCount score".split(" "),
]