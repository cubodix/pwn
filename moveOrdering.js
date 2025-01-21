orderingRecordPush = (record, newOrderer) => {
	let
		[tmpOrderer, headOrderer] = tmpOrderers,
		headIdx = tmpC[0]

	copyInto(newOrderer, headOrderer)
	headIdx.set(0)
	gap()

	for (let ordererI in record) {
		let orderer = record[ordererI]

		pComp(orderer.score, LESS_OR_EQ, headOrderer.score, fn(() => {
			headIdx.add(1)
		})).add()
		gap()

		headIdx.if_is(SMALLER_THAN, +ordererI + 1, fn(() => { //headIdx <= ordererI
			//swap

			copyInto(orderer, tmpOrderer)
			gap()

			copyInto(headOrderer, orderer)
			gap()

			copyInto(tmpOrderer, headOrderer)
		}))
		gap()
	}
}

orderingMatchs = (record, moveCount, out) => {
	let tmp = tmpC[1]

	out.set(T)
	for (let orderer of record) {
		//if matches tmp is 0
		tmp.pEdit(pSUB(moveCount, orderer.moveCount)).add()
		gap()

		out.pEdit(pMUL(out, pBIN(tmp))).add()
		gap()
	}

	//out is 0 if is recorded, 1 if it doesn't
}

orderingShift = (record) => {
	let tmpOrderer = tmpOrderers[0]

	copyInto(record[0], tmpOrderer)
	gap()

	for (let ordererI of range(record.length - 1)) {
		copyInto(record[+ordererI + 1], record[ordererI])
		gap()
	}
	
	copyInto(tmpOrderer, record[record.length - 1])
}