thisCtx = () => Context.findByName(Context.current)

addCallback = (obj) => {
	//grouped
	obj.GROUPS = obj.GROUPS ?? []

	if (typeof(obj.GROUPS) != "object") {
		obj.GROUPS = [obj.GROUPS]
	}
		
	groupeds.forEach(g => obj.GROUPS.push(group(g)))
	
	//gaps
	if (thisCtx().gap !== undefined) {
		obj.X = (thisCtx().gap ?? 0)
	}
	thisCtx().gapUsed = true

	//guide relative
	if (guideRelatived && thisCtx().gap === undefined) {
		obj.Y = (obj.Y ?? 0) + GUIDE_Y
		obj.X = (obj.X ?? 0) + GUIDE_X
		obj.GROUPS.push(guided)
	}

	return obj
}

gap = () => {
	if (thisCtx().gapUsed ?? false) {
		thisCtx().gap = (thisCtx().gap ?? 0) + 1
		thisCtx().gapUsed = false
	}
}

groupeds = []
grouped = (g) => {
	let idx = groupeds.indexOf(g.value)
	if (idx == -1) {
		groupeds.push(g.value)
	} else {
		groupeds.splice(idx, 1)
	}
}

guideRelatived = false
guideRelative = () => {
	guideRelatived ^= true
}