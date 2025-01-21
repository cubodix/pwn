let iEdit = (item1, item2, target, assign_op = EQ, op1 = ADD, op2 = MUL, mod = 1, absn1 = NONE, absn2 = NONE, rfc1 = NONE, rfc2 = NONE) =>
	item_edit(
		item1.item ?? NONE,
		item2.item ?? NONE,
		target.item ?? NONE,
		item1.type ?? NONE,
		item2.type ?? NONE,
		target.type ?? NONE,
		assign_op,
		op1,
		op2,
		mod,
		absn1,
		absn2,
		rfc1,
		rfc2,
	)

let weighExpr = expr =>
	[
		expr => expr.type, //N 0
		expr => expr.l.l.type && expr.l.r.type && expr.pOp != ADD && expr.pOp != SUB && typeof(expr.r) == "number", //M 1
		expr => expr.l.type && expr.r.type, //O 2
		expr => expr.l.type && typeof(expr.r) == "number", //K 3
		expr => typeof(expr) == "number", //C 4

		//unordered exprs (>4)
		expr => typeof(expr.l) == "number" && expr.r.l.type && expr.r.r.type && expr.pOp != ADD && expr.pOp != SUB, //m 5
		() => false,
		expr => typeof(expr.l) == "number" && expr.r.type, //k 7
	].findIndex(fn => {
		try {
			return fn(expr)
		} catch {
			return false
		}
	})

let fnUnwrap = (expr, rfc, absneg, fns) => {
	while (expr.n !== undefined) {
		let idx = expr.rfc ? rfc : absneg
		if (fns[idx] != NONE)
			return
		fns[idx] = expr.pOp
		expr = expr.n
	}
	return expr
}

let fnSearch = (expr, fns) => {
	if (expr.n !== undefined)
		return true

	for (let idx in {l: 0, r: 0}) {
		if (!expr[idx])
			continue

		let sub = fnSearch(expr[idx], fns)

		if (sub === undefined)
			return

		if (sub) {
			expr[idx] = fnUnwrap(expr[idx], "RFC_1", "ABSNEG_1", fns)
			let wExpr = weighExpr(expr[idx])

			if (wExpr == -1)
				return null

			if (wExpr == 0 || wExpr == 2)
				expr[idx] = pMUL(expr[idx], 1)

			return
		}
	}
		
	return false
}

let parseCompSide = expr => { //returns [side_props, is_numerical]
	let fns = {
		RFC_: NONE,
		ABSNEG_: NONE,
	}

	expr = fnUnwrap(expr, "RFC_", "ABSNEG_", fns)

	if (expr === undefined)
		return

	if (typeof(expr) == "number")
		return [{ITEM_ID_: NONE, TYPE_: NONE, COMP_OP_: MUL, MOD_: expr, ...fns}, true]

	if (expr.type)
		return [{ITEM_ID_: expr.item, TYPE_: expr.type, COMP_OP_: MUL, MOD_: 1, ...fns}, false]

	if (typeof(expr.l) == "number" && expr.r.type && expr.pOp != SUB && expr.pOp != DIV)
		[expr.l, expr.r] = [expr.r, expr.l]

	if (expr.l.type && typeof(expr.r) == "number")
		return [{ITEM_ID_: expr.l.item, TYPE_: expr.l.type, COMP_OP_: expr.pOp, MOD_: expr.r, ...fns}, false]

	return
}

let tryExpr = (l, r, wl, wr, figure) => {
	switch (figure) {
	case 0:
		if (wl != 0 || wr != 0)
			return
		
		return iEdit(r.l, r.r, l, EQ, r.pOp)
	case 1:
		if ((wl != 0 || r.l.type != l.type || r.l.item != l.item) && r.pOp != SUB && r.pOp != DIV) //is op number upside down?
			[wl, wr, r.l, r.r] = [wr, wl, r.r, r.l]

		if (wl != 0 || r.l.type != l.type || r.l.item != l.item)
			return

		switch (wr) {
		case 1:
			return iEdit(r.r.l.l, r.r.l.r, l, r.pOp, r.r.l.pOp, r.r.pOp, r.r.r)

		case 2:
			return iEdit(r.r.l, r.r.r, l, r.pOp, r.r.pOp)

		case 3:
			if (r.r.pOp != MUL && r.r.pOp != DIV)
				return

			return iEdit(r.r.l, NONE, l, r.pOp, ADD, r.r.pOp, r.r.r)

		case 4:
			return iEdit(NONE, NONE, l, r.pOp, ADD, MUL, r.r)
		}
		return
	case 2:
		if (wr != 4 || r.pOp == ADD || r.pOp == SUB)
			return

		switch (wl) {
		case 0:
			return iEdit(r.l, NONE, l, EQ, ADD, r.pOp, r.r)

		case 2:
			return iEdit(r.l.l, r.l.r, l, EQ, r.l.pOp, r.pOp, r.r)
		}
	}
}

//absneg
pABS = n => ({pOp: ABS, rfc: 0, n: n}),
pNEG = n => ({pOp: NEG, rfc: 0, n: n}),

//rfc
pRND = n => ({pOp: RND, rfc: 1, n: n}),
pFLR = n => ({pOp: FLR, rfc: 1, n: n}),
pCEI = n => ({pOp: CEI, rfc: 1, n: n}),

//binary
pADD = (l, r) => ({pOp: ADD, l: l, r: r}),
pSUB = (l, r) => ({pOp: SUB, l: l, r: r}),
pMUL = (l, r) => ({pOp: MUL, l: l, r: r}),
pDIV = (l, r) => ({pOp: DIV, l: l, r: r}),

pEdit = (left, right) => { //returns undefined if input is invalid
	if (left.type < ITEM || left.type > POINTS) { //left should be item, timer or points
		return
	}

	let
		is_num = right.type !== undefined,
		is_con = typeof(right) == "number",

		l = {...left},
		r = is_con ? right : {...right},

		fns = {
			ABSNEG_1: NONE,
			ABSNEG_2: NONE,
			RFC_1: NONE,
			RFC_2: NONE,
		}

	if (!is_con) {
		r = fnUnwrap(r, "RFC_2", "ABSNEG_2", fns)
		is_num = r.type !== undefined
		is_con = typeof(r) == "number"
		
		if (!r || fnSearch(r, fns) === null) {
			return
		}
	}

	//immediate vals
	if (is_num || is_con) {
		[fns.RFC_1, fns.RFC_2, fns.ABSNEG_1, fns.ABSNEG_2] =
			[fns.RFC_2, fns.RFC_1, fns.ABSNEG_2, fns.ABSNEG_1]
		let out = is_num ? iEdit(r, NONE, l) : iEdit(NONE, NONE, l, EQ, ADD, MUL, r)
		Object.entries(fns).forEach(args => out.with(...args))
		return out
	}

	let
		out,
		wl = weighExpr(r.l),
		wr = weighExpr(r.r)

	if (wl > 4 && r.l.pOp != DIV && r.l.pOp != SUB) //swap right left expr
		[wl, r.l.l, r.l.r] = [wl - 4, r.l.r, r.l.l]
		
	if (wr > 4 && r.r.pOp != DIV && r.r.pOp != SUB) //swap right right expr
		[wr, r.r.l, r.r.r] = [wr - 4, r.r.r, r.r.l]

	if (wl > wr && r.pOp != DIV && r.pOp != SUB) //swap if unsorted weights
		[wl, wr, r.l, r.r] = [wr, wl, r.r, r.l]

	for (let figure = 0; figure < 3; ++figure) //figure out the operation structure
		if (out = tryExpr({...l}, {...r}, wl, wr, figure)) {
			Object.entries(fns).forEach(args => out.with(...args))
			return out
		}
}

pComp = (left, op, right, trueId = group(0), falseId = group(0), tol = 0) => {
	let
		lProps = parseCompSide(left),
		rProps = parseCompSide(right)

	if ((lProps === undefined || rProps === undefined) || (lProps[1] && rProps[1])) //some side failed or both are constants
		return
		
	let revOps = [EQ, LESS, LESS_OR_EQ, GREATER, GREATER_OR_EQ, NOT_EQ]
	if (lProps[1] && !rProps[1]) //one is constant, but wrong order
		[lProps, rProps, op] = [rProps, lProps, revOps[op]]

	let out = {
		OBJ_ID: 3620,
		COMP_OP: op,
		TRUE_ID: trueId,
		FALSE_ID: falseId,
		TOL: tol,
	}

	for (let i of range(2)) {
		let props = [lProps[0], rProps[0]][i]
		for (let idx in props) {
			let fullProp = idx + (i + 1)
			out[fullProp == "MOD_1" ? "MOD" : fullProp] = props[idx]
		}
	}

	return object(out)
}

//A = 1 + 2 // FIGURE 0, sum
//NN
//B = A * m // FIGURE 2, mod, mod(sum)
//NC + NC * OC
//C = 0 + B // FIGURE 1, sum(mod(sum)), -sum-, sum(sum), **sum(n, mod)
//NM NO NO