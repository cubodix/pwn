_crypto = require("crypto")
fs = require("fs")
path = require("path")

assert = console.assert
log = console.log
flr = Math.floor
ceil = Math.ceil
abs = Math.abs
inf = 2147483647
identity = x => x

timer = () => counter(0, false, false, true)
emptyFn = () => fn(() => {})

F = 0
T = 1

boolIter = [false, true]

//gd fact
TICKS_A_SEC = 240

pBIN = (c) => pDIV(c, c)

range = (a, b) =>
	b === undefined ?
		range(0, a) :
		Array.from(
			{length: b - a},
			(_, i) => a + i,
		)

factorial = n => (n <= 1 ? 1 : n * factorial(n - 1))

mapObj = (obj, fn) =>
	Object.fromEntries(Object.entries(obj).map(fn))

repeat = (len, fn) =>
	Array.from({length: len}, () => fn())

objFilter = (obj, filter) => {
	let out = {}

	for (let filterIdx of filter) {
		out[filterIdx] = obj[filterIdx]
	}

	return out
}

resetRemap = ["RESET_REMAP", T]
neutralRemap = [0, 0]

let oldCounter = counter
counter = (...args) => {
	let out = oldCounter(...args)
	
	out.pEdit = (right) => pEdit(out, right)

	out.to_const = (checks, onMatch) => {
		for (let check of checks) {
			out.if_is(
				EQUAL_TO, check,
				fn(() => {
					onMatch(check)
				}),
			)
			gap()
		}
	}

	out.to_const_unorder = (checks, onMatch) => {
		for (let check of checks) {
			out.if_is(
				EQUAL_TO, check,
				fn(() => {
					onMatch(check)
				}),
			)
		}
	}

	return out
}

fn = (...args) => {
	let fn = trigger_function(...args)

	fn.ext = (cb) => {
		$.extend_trigger_func(fn, cb)
	}
	
	return fn
}

imm = {}
defImms = (...args) => {
	for (let n of args)
		if (!imm.hasOwnProperty(n))
			imm[n] = counter(n, false, false, n % 1 !== 0 /*is timer (float)*/)
}

flash = (color = [127, 127, 127], fadeOut = 0.05) =>
	object({
		OBJ_ID: obj_ids.triggers.PULSE,
		TRIGGER_RED: color[0],
		TRIGGER_GREEN: color[1],
		TRIGGER_BLUE: color[2],
		FADE_OUT: fadeOut,
		TARGET: BG,
	}).add()

SHIFT_LEFT = 0
SHIFT_RIGHT = 1

shiftToggles = (groups, shift = SHIFT_RIGHT, tmp = tmpG[0]) => {
	if (shift == SHIFT_RIGHT) {
		groups = groups.toReversed()
	}

	for (let i of range(groups.length + 1)) {
		let
			gA = groups[i] ?? tmp,
			gZ = groups[i - 1] ?? tmp

		gZ.toggle_off()
		gap()

		grouped(gA)
		gZ.toggle_on()
		grouped(gA)
		gap()
	}
}

constDivModule = (to, from, div) => {
	to.pEdit(pDIV(from, div)).add()
	gap()
	
	to.multiply(div)
	gap()
	
	to.pEdit(pSUB(from, to)).add()
}

remapDisarm = (remaps, proto, config) => { //returns true if everything is ok
	for (let idx in proto) {
		let
			pObj = proto[idx],
			cObj = config[idx],
			pType = typeof(pObj),
			cType = typeof(cObj)

		if (pType != cType)
			return false

		switch (pType) {
		case "object":
			if (pObj.type === undefined) { //tree object
				if (!remapDisarm(remaps, pObj, cObj)) {
					return false //error propagation
				}
				break
			} else { //item or group object
				if (pObj.type != cObj.type)
					return false
				pObj = pObj.item ?? pObj.value
				cObj = cObj.item ?? cObj.value
				//do a switch fall-through
			}

		case "number":
			remaps.push([pObj, cObj])
			break

		default:
			return false
		}
	}

	return true
}

remapInto = (fn, proto, config) => {
	let remaps = []
	
	if (remapDisarm(remaps, proto, config)) {
		remaps = remaps.filter(([remapFrom, remapTo]) => remapFrom != remapTo)

		if (remaps.length == 0) {
			remaps = [neutralRemap]
		}

		return fn.remap(...remaps)
	}
}

copyIntoBuf = []

copyInto = (structA, structB, head = true) => {
	for (let idx in structA) {
		let
			objA = structA[idx],
			objB = structB[idx]

		if (!objB) {
			continue
		}

		if (
			typeof(objA) != "object" ||
			typeof(objB) != "object" ||
			objA.type != objB.type) {
			return false
		}

		switch (objA.type) {
		case undefined:
			if (!copyInto(objA, objB, false)) {
				return false
			}
			break

		case ITEM:
			copyIntoBuf.push(objB.pEdit(objA))
			break

		default:
			return false
		}
	}

	if (head) {
		copyIntoBuf.forEach(x => x.add())
		copyIntoBuf = []
	}

	return true
}

fnToConst = (counter, fns) => { //to_const but you can const with a group or trigger function
	for (let i in fns) {
		counter.if_is(EQUAL_TO, i, fns[i])
		gap()
	}
}

constBasePow = (out, base, exp) => {
	out.pEdit(1).add()

	let
		div = 16,
		accuracy = 40

	for (let _ of range(accuracy)) {
		pComp(
			exp, GREATER_OR_EQ, div,
			fn(() => {
				out.pEdit(pMUL(out, Math.pow(base, div))).add()
				exp.pEdit(pSUB(exp, div)).add()
			}),
		).add()

		div /= 2
	}
}

tickLoop = cb => {
	let
		collG = unknown_g(),
		collA = unknown_b(),
		collB = unknown_b()
			
	object({
		OBJ_ID: obj_ids.special.COLLISION_BLOCK,
		BLOCK_A: collA,
	}).add()
		
	object({
		OBJ_ID: obj_ids.special.COLLISION_BLOCK,
		BLOCK_A: collB,
		GROUPS: collG,
		DYNAMIC_BLOCK: true,
	}).add()

	on(collision(collA, collB), fn(() => {
		collG.toggle_off()
		cb.call().add()
	}))

	on(collision_exit(collA, collB), fn(() => {
		collG.toggle_on()
		cb.call().add()
	}))
}

SFX_TRIGGER = 3602

simpleSfx = (sfxId, volume = 1) =>
	object({
		OBJ_ID: SFX_TRIGGER,
		SFX_ID: sfxId,
		SONG_VOLUME: volume,
	})

bitTableToConst = (counter, bitTable, checks, onMatch, ordered = false) => {
	let toCheck = 0

	while (toCheck < checks.length) {
		let
			checkSlice = [toCheck, Math.min(checks.length, toCheck + bitTable.length)],
			checkRange = range(...checkSlice),
			checkLen = checkSlice[1] - checkSlice[0]

		//fill the table with on
		for (let bit of bitTable.slice(0, checkLen)) {
			bit.toggle_on()
		}
		gap()

		//remove bits in the table that don't match
		for (let checkI in checkRange) {
			for (let comp of [LARGER_THAN, SMALLER_THAN]) {
				counter.if_is(comp, checks[checkRange[checkI]], bitTable[checkI], false)
			}
		}
		gap()

		//run the bit that matched (or maybe none matched)
		for (let checkI in checkRange) {
			let bit = bitTable[checkI]

			grouped(bit)
			onMatch(checks[checkRange[checkI]])
			if (ordered) {
				gap()
			}
			grouped(bit)
		}
		gap()

		toCheck = checkSlice[1]
	}
}