//initialize
initialize.ext(() => {
	camera_static(guide, 0, NONE, false, false, false, 0, true)

	camera_mode()
})

//structure
DEFAULT_BLOCK = 1

for (let dir of range(4)) {
	object({
		OBJ_ID: DEFAULT_BLOCK,
		GROUPS: [alpha0],
		Y: [-1, 1, 0, 0][dir] * TILE_STEP + TILE_STEP / 2,
		X: [ 0, 0,-1, 1][dir] * TILE_STEP,
	}).add()
}

//controls
PLAYER_1 = 0
PLAYER_2 = 1

L_PUSH = 0
R_PUSH = 1
U_PUSH = 2

clickEvents = "LEFT_PUSH RIGHT_PUSH JUMP_PUSH".split(" ")

inputEvent = (player, click) => fn(() => {
	//P1: vertical, P2: horizontal
	//L: negative, R: positive

	inputBreak.toggle_on()
	gap()

	if (click == U_PUSH && player == PLAYER_2) {
		selClick.call().add()
	} else {
		let thisBoardEvent = boardEvent(player, click)

		cursorAdditionalGs.forEach(grouped)
		humanOn.if_is(EQUAL_TO, T, thisBoardEvent)
		cursorAdditionalGs.forEach(grouped)
	}
	gap()
	
	grouped(inputBreak)
	grouped(UIPointerMenu)
	if (click == L_PUSH) {
		menuUpClick.call().add()
	}

	if (click == R_PUSH) {
		menuDownClick.call().add()
	}

	if (click == U_PUSH && player == PLAYER_1) {
		menuOkClick.call().add()
	}
	grouped(UIPointerMenu)
	grouped(inputBreak)
})

initializeRender.ext(() => {
	for (let player of [PLAYER_1, PLAYER_2]) {
		for (let click of [L_PUSH, R_PUSH, U_PUSH]) {
			on(
				event(events[clickEvents[click]], group(0), group(player + 1)),
				inputEvent(player, click),
			)
		}
	}
})