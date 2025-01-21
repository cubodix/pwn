rayAbsOffs = [9, 7, 1, 8] //ray absolute offsets
rayOffs = [...rayAbsOffs, ...rayAbsOffs.map(x => -x)] //ray offsets
rayOrders = Object.fromEntries([
	[til.q, [-9, -7, -8, -1, 1, 9, 7, 8]],
	[til.r, [-8, 1, -1, 8]],
	[til.b, [-9, -7, 9, 7]],
])

for (let rayOrderI in rayOrders) {
	rayOrders[rayOrderI] = rayOrders[rayOrderI].map(off => rayOffs.indexOf(off))
}

diagPath = (dir /*0 nwse, 1 nesw*/, chu /*0..15*/) => {
	let out = []

	for (let y of range(8)) {
		let x = dir ?
			14 - chu - y :
			-7 + chu + y
		
		if (x >= 8 || x < 0) {
			continue
		}

		out.push(y * 8 + x)
	}

	return out
}

rectPath = (dir /*0 horizontal, 1 vertical*/, chu /*0..8*/) => {
	let
		offDiff = dir ? 8 : 1,
		chuDiff = dir ? 1 : 8,
		out = []

	for (let off of range(8)) {
		out.push(chu * chuDiff + off * offDiff)
	}

	return out
}

let
	rayBreak = nodeA.pieMem[0],
	rayPiece = nodeA.pieMem[1]

initShotRay = (ray /*0: foward, 1: backward*/, dir, chu) => fn(() => {
	let
		path = (dir < 2 ? diagPath : rectPath)(dir % 2, chu),
		stepAbs = rayAbsOffs[dir],
		step = stepAbs * (ray ? -1 : 1)

	rayBreak.pEdit(pADD(nodeA.src, imm[step])).add() //ray startpos
	rayPiece.set(til.p)
	gap()

	for (let pathI in path) {
		if (pathI == 0) { //first check is impossible to assert
			continue
		}

		pathI = ray ? path.length - 1 - pathI : pathI

		let
			checkPos = path[pathI],
			checkTile = nodeA.tiles[checkPos]

		rayBreak.if_is(EQUAL_TO, checkPos, fn(() => { //is in tile
			rayBreak.add(step)
			pComp(
				checkTile, NOT_EQ, til._,
				fn(() => {
					rayPiece.set(checkTile)
					rayBreak.add(-step)
				}),
			).add()
		}))
		gap()
	}
})

RAY_NWSE = 0
RAY_NESW = 1
RAY_HORIZONTAL = 2
RAY_VERTICAL = 3

RAY_FOWARD = 0
RAY_BACKWARD = 1

RAY_CHECK = 0
RAY_MOVEGEN = 1

shotRay = [[[], []], [[], []]] //[gen][ray][dir][chu], shoots two rays in opposite direction

for (let gen of [RAY_CHECK, RAY_MOVEGEN])
for (let ray of [RAY_FOWARD, RAY_BACKWARD])
for (let dir of [RAY_NWSE, RAY_NESW, RAY_HORIZONTAL, RAY_VERTICAL]) {
	let
		shotRayDir = [],
		manyChunks = dir < 2 ? 15 : 8 //how many chunks has this dir

	for (let chu of range(manyChunks)) {
		shotRayDir.push(initShotRay(ray, dir, chu))
	}

	shotRay[gen][ray].push(shotRayDir)
}

adjustNwse = ([k, v]) => [k - 7, v]
adjustNesw = ([k, v]) => [14 - k, v]

shotPointedRay = (gen, ray, dir) => {
	if (dir < 2) {
		tmpC[0].pEdit([pSUB(srcX, srcY), pADD(srcX, srcY)][dir]).add()
		gap()
	}

	fnToConst(
		[tmpC[0], tmpC[0], srcY, srcX][dir],
		mapObj(shotRay[gen][ray][dir], [adjustNwse, adjustNesw, identity, identity][dir]),
	)
}

quietRayMove = rayOrder => {
	movChu.to_const(range(rayOrder.length), (chunk) => {
		let rayI = rayOrder[chunk]

		movOff.if_is(EQUAL_TO, 0, fn(() => {
			shotPointedRay(RAY_MOVEGEN, flr(rayI / 4), rayI % 4)
		}))
		gap()

		dst.set(nodeA.src)
		gap()

		dst.pEdit(pADD(dst, pMUL(pADD(movOff, imm[1]), rayOffs[rayI]))).add() //set destine
		gap()

		tmpC[0].pEdit(pSUB(dst, nodeA.pieMem[0])).add() //0 if dst and pieMem[0] are equal
		movChu.add(1)
		gap()

		movOff.pEdit(pMUL(movOff, pBIN(tmpC[0]))).add() //set to 0 if dst and pieMem[0] are equal
		movChu.pEdit(pSUB(movChu, pBIN(tmpC[0]))).add() //add 1 if dst and pieMem[0] are equal
	})
	gap()

	nodeA.mov.set(movOff)
	gap()

	nodeA.mov.pEdit(pADD(nodeA.mov, pMUL(movChu, 7))).add()
	gap()

	nodeA.mov.if_is(LARGER_THAN, rayOrder.length * 7 - 1, srcBreak)
}

captureRayMoveBreak = fn(() => {
	nodeA.mov.add(-1)
	dst.set(nodeA.pieMem[0])
})

captureRayMove = (rayOrder) => { //is ray piece
	nodeA.mov.to_const(range(rayOrder.length), (chunk) => {
		let rayI = rayOrder[chunk]

		shotPointedRay(RAY_MOVEGEN, flr(rayI / 4), rayI % 4)
		gap()

		nodeA.mov.add(1)
		nodeA.pieMem[1].if_is(...isBlack, captureRayMoveBreak)
	})
	gap()

	nodeA.mov.if_is(EQUAL_TO, rayOrder.length, srcBreak)
}