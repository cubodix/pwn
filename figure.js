pawnFigure = (x, y) => {
	//symmetry
	let
		isAsymmetrical = x > 1 / 2

	if (isAsymmetrical) {
		x = 1 - x
	}

	//head
	let
		headRadius = 1 / 5,
		headX = 1 / 2,
		headY = 1 - headRadius,
		distanceToHead = Math.sqrt((headX - x) ** 2 + (headY - y) ** 2),
		isInsideHead = distanceToHead <= headRadius

	if (isInsideHead) {
		return true
	}

	//neck
	let
		neckHeight = 1 / 28,
		neckWidth = headRadius - neckHeight,
		neckX = 1 / 2,
		neckY = headY - headRadius - neckHeight,
		neckXDist = Math.abs(neckX - x),
		neckYDist = Math.abs(neckY - y),
		isInsideNeck = neckXDist <= neckWidth && neckYDist <= neckHeight
	
	if (isInsideNeck) {
		return true
	}

	//neck border
	for (let neckBorderDir of [-1, 1]) {
		let
			neckBorderRadius = neckHeight,
			neckBorderX = neckX + neckWidth * neckBorderDir,
			neckBorderY = neckY,
			distanceToNeckBorder = Math.sqrt((neckBorderX - x) ** 2 + (neckBorderY - y) ** 2),
			isInsideNeckBorder = distanceToNeckBorder <= neckBorderRadius

		if (isInsideNeckBorder) {
			return true
		}
	}

	//limit for bottom side of the pawn
	let
		isOutOfBounds = x < 21 / 100
	
	if (isOutOfBounds) {
		return false
	}

	//body
	let
		isInBody = (x * 2) ** 4 >= y

	if (isInBody) {
		return true
	}

	//foot
	let
		isInFoot = Math.log2((x - 1 / 5) * 1000) / 20 - 3 / 25 >= y
	
	if (isInFoot) {
		return true
	}

	//defualt
	return false
}

let
	pwnWidth = 19,
	pwnHeight = 5,
	pwn = "\
		# # # # _ _ _ # _ _ _ # _ _ # _ _ _ #\
		# _ _ _ # _ _ # _ _ _ # _ _ # # _ _ #\
		# # # # _ _ _ # _ # _ # _ _ # _ # _ #\
		# _ _ _ _ _ _ # _ # _ # _ _ # _ _ # #\
		# _ _ _ _ _ _ _ # _ # _ _ _ # _ _ _ #\
	",
	pwnBits =
		pwn
		.split("")
		.filter((c) => c == "#" || c == "_")
		.map((c) => "_#".split("").indexOf(c) > 0)

pwnFigure = (x, y) => {
	let
		pixelWidth = 1 / pwnWidth,
		pixelHeight = pixelWidth,
		yCenter = .79,
		fromYCenter = Math.abs(y - yCenter),
		pwnDisplayHeight = pwnHeight * pixelHeight
		isInPwn = fromYCenter < pwnDisplayHeight / 2
	
	if (!isInPwn) {
		return false
	}

	let
		pwnBottom = yCenter + pwnDisplayHeight / 2,
		pixelX = Math.floor(x / pixelWidth),
		pixelY = Math.floor((pwnBottom - y) / pixelHeight),
		pixelI = pixelY * pwnWidth + pixelX,
		isSolid = pwnBits[pixelI]
	
	return isSolid
}

figure = (...args) =>
	pawnFigure(...args) ^
	pwnFigure(...args)

displayFigure = () => {
	let
		exampleDisplayLength = 80,
		exampleDisplay = "",
		border = "[]"

	exampleDisplay += repeat(exampleDisplayLength + 2, () => border).join("")
	exampleDisplay += "\n"
	exampleDisplay += border
	
	for (let y of range(exampleDisplayLength).toReversed()) {
		for (let x1 of range(exampleDisplayLength * 2)) {
			let
				x = x1 / 2,
				top = figure(x / exampleDisplayLength, (y + 0.5) / exampleDisplayLength),
				bottom = figure(x / exampleDisplayLength, y / exampleDisplayLength)
	
			exampleDisplay +=
				top ?
					bottom ?
						"█" :
						"▀" :
					bottom ?
						"▄" :
						" "
		}

		exampleDisplay += border
		exampleDisplay += "\n"
		exampleDisplay += border
	}
	
	exampleDisplay += repeat(exampleDisplayLength + 1, () => border).join("")
	return exampleDisplay
}

makeFigure = () => {
	let
		isCtxFigure = (ctx) => ctx.name != "global",
		getCtxLength = (ctx) => 
			ctx
			.objects
			.map((obj) => obj.X ?? 0)
			.reduce((a, b) => Math.max(a, b), 0)
			+ 1,

		figureCtxs =
			Object
			.values(Context.list)
			.filter(isCtxFigure),

		triggersWidth =
			figureCtxs
			.map(getCtxLength)
			.reduce((a, b) => Math.max(a, b), 0),

		figureMinWidth = TILE_STEP * 30,

		figureWidth = Math.max(triggersWidth, figureMinWidth),
		
		figureYSubdiv = 30,

		figureHeight = figureWidth,

		croppedWidth = TILE_STEP / figureWidth / 2 * (6 / 12),
		croppedHeight = TILE_STEP / figureWidth / 2 * (9 / 12),

		crops = (x, y) => [
			[x - croppedWidth, y - croppedHeight],
			[x - croppedWidth, y + croppedHeight],
			[x + croppedWidth, y - croppedHeight],
			[x + croppedWidth, y + croppedHeight],
		],

		clampedFigure = (x, y) =>
			(x <= 1 && x >= 0 && y <= 1 & y >= 0) &&
			figure(x, y)

		croppedFigure = (...args) =>
			crops(...args)
			.map((args) => clampedFigure(...args))
			.reduce((a, b) => a && b, true),

		subdivNoise = (x) => x * 17 % figureYSubdiv / figureYSubdiv,

		figureArray =
			range(Math.floor(figureHeight / figureYSubdiv) + 1)
			.map((y) =>
				range(figureWidth)
				.map((x) =>
					croppedFigure(
						x / figureWidth,
						(y + subdivNoise(x)) * figureYSubdiv / figureHeight,
					)
				)
			),

		figureColumnTrueIdxs =
			Object
			.entries(figureArray)
			.map(([rowI, row]) =>
				row
				.map((isItemOn) => isItemOn ? [+rowI] : [])
			)
			.reduce(
				(acc, cur) =>
					range(figureWidth)
					.map((i) => ([...acc[i], ...cur[i]])),
				repeat(figureWidth, () => []),
			),

		figureXDistribution =
			figureColumnTrueIdxs
			.map((col) => col.length),

		sortedContextsLengths =
			figureCtxs
			.map(getCtxLength)
			.toSorted((a, b) => a - b)
			.toReversed(),

		distributionInstructions = //[[objX, ...]]
			sortedContextsLengths
			.map((ctxLength) => {
				let
					pickedSlice =
						range(figureXDistribution.length)
						.toSorted((i0, i1) =>
							figureXDistribution[i0] -
							figureXDistribution[i1]
						)
						.toReversed()
						.filter((i) => figureColumnTrueIdxs[i].length > 0)
						.slice(0, ctxLength)
						.toSorted((a, b) => a - b)

				assert(pickedSlice.length == ctxLength)
				
				for (let i of pickedSlice) {
					figureXDistribution[i] -= 1
				}
				
				return pickedSlice
			}),

			rowTurns = repeat(figureWidth, () => 0)

	log("figure width", figureWidth)

	assert(figureColumnTrueIdxs.length == figureWidth)
	assert(
		Object
		.entries(figureColumnTrueIdxs)
		.every(([col, rows]) =>
			rows
			.every((row) => figureArray[row][col])
		)
	)
	
	let emptyTrueColumns =
		Object
		.entries(figureColumnTrueIdxs)
		.filter(([_col, rows]) => rows.length == 0)
		.map(([col, _rows]) => +col)

	assert(figureWidth - emptyTrueColumns.length >= triggersWidth)

	//triggers are correctly distributed
	assert(
		figureXDistribution
		.every((x) => x <= 0)
	)
	
	for (let ctx of figureCtxs) {
		let
			ctxLength = getCtxLength(ctx),
			ctxObjs = ctx.objects,

			instructionIdx =
				distributionInstructions
				.map((instruction) => instruction.length)
				.indexOf(ctxLength),

			instruction =
				distributionInstructions
				.splice(instructionIdx, 1)[0]
		
		assert(instructionIdx >= 0)
		assert(instruction.length == ctxLength)
		
		for (let idx in ctxObjs) {
			let
				objX = ctxObjs[idx].X ?? 0,
				x = instruction[objX],
				trueColIdx = rowTurns[x]++ % figureColumnTrueIdxs[x].length,
				subdivY = figureColumnTrueIdxs[x][trueColIdx],
				noise = subdivNoise(x),
				y = (subdivY + noise) * figureYSubdiv

			assert(objX < figureWidth)
			assert(noise <= 1 && noise >= 0)

			ctxObjs[idx].X = x
			ctxObjs[idx].Y = y
		}
	}
}

makeFigure()