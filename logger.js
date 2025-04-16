llog = l => {
	["item", "value"].forEach(prop => {
		if (global[l][prop])
			log(l, global[l][prop])
	})
}

llogObj = obj => {
	for (let idx in global[obj]) {
		log(`${obj}[${idx}]`, global[obj][idx].item)
	}
}

staticCounters.forEach(llog)
log()

staticGroups.forEach(llog)
log()

staticFunctions.forEach(llog)
log()

llog("moveGen")
log()

llogObj("imm")
log()

llogObj("depthMove")
log()

llogObj("thisMove")
log()

log(displayFigure())