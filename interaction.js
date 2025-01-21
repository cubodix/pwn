boardEvent = (player, click) => fn(() => {
	inputBreak.toggle_off() //cancell other inputs

	if (click == L_PUSH || click == R_PUSH) {
		let
			dirI = player * 2 + click,
			dirY = [ 1,-1, 0, 0][dirI],
			dirX = [ 0, 0,-1, 1][dirI],
			payload = fn(() => {
				boardCursor.move(dirX * 10, dirY * 10)
				cursorIdx.add(dirY * -8 + dirX)
			})

		sfx.boardShift.call().add()
		if (player == PLAYER_1) {
			cursorIdx.if_is(...(click ? [SMALLER_THAN, 56] : [LARGER_THAN, 7]), payload)
		} else if (player == PLAYER_2) {
			tmpC[0].pEdit(pDIV(cursorIdx, 8)).add()
			gap()

			//cursor - cursorY * 8 != bound
			//cursor - bound != cursorY * 8
			pComp(pSUB(cursorIdx, click * 7), NOT_EQ, pMUL(tmpC[0], 8), payload).add()
		}
	}

	if (click == U_PUSH && player == PLAYER_1) {
		boardOkClick.call().add()
	}
})

gameBoardOkClick = () => {
	toCursor.toggle_on()
	fromCursor.toggle_on()
	tmpC[1].set(F) //will be 256 if humanMove ran
	targetCursorIdx.set(cursorIdx)
	gap()

	//flip targetCursorIdx if board is flipped
	isBoardHFlipped.if_is(EQUAL_TO, T, fn(() => {
		runHPosFlip(targetCursorIdx, cursorIdx)
	}))
	gap()

	for (let ord of ordsIter) {
		for (let tile of tilesIter) {
			grouped(boardValids[ord][tile])
			cursorIdx.if_is(EQUAL_TO, tile, humanMove)
			grouped(boardValids[ord][tile])
		}
	}
	gap()

	cleanBoardEffects.call().add()
	gap()

	tmpC[1].if_is(EQUAL_TO, F, fn(() => { //did not humanMove
		bitTableToConst(targetCursorIdx, boardOkClickTmps, tilesIter, (cursor) => {
			nodes[0].tiles[cursor].if_is(...isWhite, drawBoardEffects)
		})
	}))
}

editBoardOkClick = () => {
	let
		pieceToPut = tmpC[0],
		voidTile = tmpC[1]

	pieceToPut.set(-1)
	editBoardOkClickBreak.toggle_on()
	gap()

	grouped(editBoardOkClickBreak)
	voidTile.set(-1)

	for (let piece of piecesIter) {
		let arrow = editMenuArrows[editMenuPieces[piece]]

		grouped(arrow)
		pieceToPut.set(piece)
		grouped(arrow)
	}
	gap()

	pieceToPut.if_is(EQUAL_TO, -1, editBoardOkClickBreak, false)

	let
		breakFn = fn(() => {
			editBoardOkClickBreak.toggle_off()
		}),
		ifIsPawn = fn(() => {
			cursorIdx.if_is(SMALLER_THAN, 8, editBoardOkClickBreak, false)
			cursorIdx.if_is(LARGER_THAN, 55, editBoardOkClickBreak, false)
		})

	for (let color of colorsIter) {
		let
			isPieceToPutColorPawn = [EQUAL_TO, color == WHITE ? til.p : til.P],
			isCursorInColorKing = [cursorIdx, EQ, targetPos.kings[color]]

		pieceToPut.if_is(...isPieceToPutColorPawn, ifIsPawn)
		pComp(...isCursorInColorKing, breakFn).add()
	}
	gap()

	for (let color of colorsIter) {
		let isPieceToPutColorKing = [EQUAL_TO, color == WHITE ? til.k : til.K]

		pieceToPut.if_is(
			...isPieceToPutColorKing,
			fn(() => {
				voidTile.set(targetPos.kings[color])

				gap()
				targetPos.kings[color].set(cursorIdx)
			}),
		)
	}
	gap()

	bitTableToConst(voidTile, editBoardOkClickTmps, tilesIter, (tileI) => {
		targetPos.tiles[tileI].set(til._)
	})
	gap()

	bitTableToConst(cursorIdx, editBoardOkClickTmps, tilesIter, (tileI) => {
		targetPos.tiles[tileI].set(pieceToPut)
	})
	gap()

	copyInto(targetPos, displayPos)
	gap()

	refreshBoard.call().add()

	let didntBreak = 256

	pieceToPut.set(didntBreak) //didntBreak if didn't break
	grouped(editBoardOkClickBreak)
	gap()

	let editBoardOkClickBreakDidntBroke = [pieceToPut, LESS, didntBreak, sfx.error]

	pComp(
		...editBoardOkClickBreakDidntBroke,
		sfx.menuClick,
	).add()
}

makeChess324Board = () => {
	let
		randomizedColorTiles = [ //which tiles should be randomized
			[57, 58, 59, 61, 62], //WHITE
			[ 1,  2,  3,  5,  6], //BLACK
		],
		randomizedTiles = randomizedColorTiles.flat(),
		nPicks = randomizedColorTiles[WHITE].length,
		initPosTiles = boardFromPosObj(ogPos).tiles,
		targets = [targetPos, displayPos]
		
	//set editor settings
	for (let editMenuSettingI in editMenuSettings) {
		let
			setting = editMenuSettings[editMenuSettingI],
			config = editMenuSettingConfigs[editMenuSettingI]

		for (let i in config) {
			let toggle = setting.ogDefault == i ? "toggle_on" : "toggle_off"

			config[i][toggle]()
		}
	}

	targetTurn.set(ogTurn)

	//all castlings start as valid
	for (let target of targets) {
		for (let castling of target.castling) {
			castling.set(T)
		}
	}

	//set king pos
	for (let color of colorsIter) {
		for (let target of targets) {
			target.kings[color].set(initKingPos[color])
		}
	}
	
	//set statics tiles
	for (let tileI of tilesIter) {
		if (!randomizedTiles.includes(tileI)) {
			for (let target of targets) {
				target.tiles[tileI].set(initPosTiles[tileI])
			}
		}
	}

	//put random pieces, without using additional groups (real)
	for (let color of colorsIter) {
		let
			leftSum = tmpC[0],
			sumCopy = tmpC[1],
			picked = tmpC[2],
			seed = tmpC[3],
			maxSeed = factorial(5),
			colorSign = color == WHITE ? 1 : -1,
			colorKnight = color == WHITE ? til.n : til.N,
			colorQueen = color == WHITE ? til.q : til.Q,
			pPieceOp = color == WHITE ? pADD : pSUB,
			pPieceAntiOp = color == WHITE ? pSUB : pADD

		//generate the seed
		rng.call().add()
		
		//fill the table with on
		for (let tablePickI of range(nPicks)) {
			chess324CheckTmps[tablePickI].toggle_on()
		}
		gap()

		seed.pEdit(pMUL(rngResult, maxSeed / RNG_FACTOR)).add()
		gap()

		//a sum of all the pickable indexes, when a index is picked
		//gets subtracted from the sum so the next iterator can ignore it
		leftSum.set(range(nPicks).reduce((a, b) => a + b, 0))

		//do 5 different piece picks
		let picks = range(1, nPicks + 1).toReversed()

		for (let pickI in picks) {
			let
				pickables = picks[pickI], //amound of possible picks
				isLastPick = pickables == 1 //only 1 option

			//set pieces to knights + sign
			for (let target of targets) {
				let tileToPut = target.tiles[randomizedColorTiles[color][pickI]]
				tileToPut.set(colorKnight + colorSign) //add the sign that gets removed if it's not a queen
			}

			if (isLastPick) {
				let pickedIdx = sumCopy
				pickedIdx.set(leftSum)
				gap()
			} else {
				//pick a random number from 0 to pick (exclusive)
				constDivModule(picked, seed, pickables)
				gap()
				
				for (let target of targets) {
					let tileToPut = target.tiles[randomizedColorTiles[color][pickI]]
					tileToPut.set(colorKnight + colorSign) //add the sign that gets removed if it's not a queen
				}
				sumCopy.set(leftSum)
				seed.divide(pickables)
				gap()

				//match the randomly picked to the bit table
				for (let tablePickI of range(nPicks)) {
					let bit = chess324CheckTmps[tablePickI]

					grouped(bit)
					picked.subtract(1)
					gap()

					//picking this one?
					picked.if_is(EQUAL_TO, -1, bit, false)
					gap()

					//this is not the picked one, remove it from the result
					sumCopy.subtract(tablePickI)
					grouped(bit)
				}
				gap()

				let pickedIdx = sumCopy

				//subtract from the sum of left pickables the
				//one you just picked
				leftSum.subtract(pickedIdx)
			}

			let
				pickedIdx = sumCopy,
				isNotQueen = picked //recycling group

			for (let target of targets) {
				let tileToPut = target.tiles[randomizedColorTiles[color][pickI]]

				//tileToPut is a knight (+1) here
				tileToPut.pEdit(pPieceOp(tileToPut, pFLR(pDIV(pickedIdx, 2)))).add()
			}
			gap()

			let tileToPut = targetPos.tiles[randomizedColorTiles[color][pickI]]
			isNotQueen.pEdit(pSUB(tileToPut, imm[colorQueen])).add() //0 if target tile is queen
			gap()

			//remove the sign if it is not a queen
			for (let target of targets) {
				let tileToPut = target.tiles[randomizedColorTiles[color][pickI]]
				tileToPut.pEdit(pPieceAntiOp(tileToPut, pFLR(pBIN(isNotQueen)))).add()
			}
			gap()
		}
	}
	gap()

	refreshBoard.call().add()
}

doPromotionMove.ext(() => {
	let promotionSelected = tmpC[4] //from gameMenuPromotionOkPost

	//this is needed because breaking the click after the gameTurn
	//is problematic, but it's not the prettiest solution
	menuOkClickBreak.toggle_off()
	
	//move menu back to normal
	UIPointerMenu.toggle_off()
	UIPointerBoard.toggle_on()

	//MOVEGEN_UI_CALLBACK_FIND_VALIDS will set tmpC[4]/validDst to dst if move is valid
	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_FIND_VALIDS)
	validDst.set(-1) //avoid match problems
	gap()

	searchMove(
		nodeA.src,
		selectedPiece,
		fn(() => {
			pComp(
				validDst, EQ, targetCursorIdx,
				fn(() => {
					promotionSelected.if_is(LARGER_THAN, 0, moveGen)
					gap()

					promotionSelected.subtract(1)
				}),
				moveGen,
			).add()
		}),
		validDst,
		targetCursorIdx,
	)
	gap()

	gameTurn.call().add()
})
	
humanMove.ext(() => {
	//MOVEGEN_UI_CALLBACK_FIND_VALIDS will set tmpC[4]/validDst to dst if move is valid
	movegenUICallbackType.set(MOVEGEN_UI_CALLBACK_FIND_VALIDS)
	wasPromotion.set(F) //assumes that if piece has a promotion move all moves are promotions
	validDst.set(-1) //avoid match problems
	gap()

	searchMove(
		nodeA.src,
		selectedPiece,
		fn(() => {
			pComp(validDst, NOT_EQ, targetCursorIdx, moveGen).add()
		}),
		validDst,
		targetCursorIdx,
	)
	gap()

	//wasPromotion will be 1 if it was a promotion
	tmpC[1].set(256) //gameBoardOkClick expects humanMove to set tmpC[1] to 256
	pComp(wasPromotion, EQ, 0, gameTurn, selectPromotion).add() //selectPromotion makes the user select the promotion
})

boardOkClick.ext(() => {
	grouped(editMenu)
	editBoardOkClick()
	grouped(editMenu)

	grouped(gameMenu)
	gameBoardOkClick()
	grouped(gameMenu)
})

let shiftableMenus = [
	[[mainMenu], mainMenuArrows],
	[[editMenu], editMenuArrows],
	[[gameMenu, gameMenuPromotion], gameMenuPromotionArrows],
]

menuClick = (dir) => {
	for (let [menuGs, menuArrows] of shiftableMenus) {
		menuGs.forEach(grouped)
		menuShift(menuArrows, dir)
		sfx.menuShift.call().add()
		menuGs.forEach(grouped)
	}
}

menuDownClick.ext(() => {
	menuClick(true)
})

menuUpClick.ext(() => {
	menuClick(false)
})

mainMenuPlayAsColor = (selectableI, _arrow) => {
	sfx.menuClick.call().add()

	let color = selectableI == MAIN_MENU_PLAY_AS_WHITE ? WHITE : BLACK

	playerType[color].set(HUMAN_PLAYER)
	playerType[oppositeColor(color)].set(ENGINE_PLAYER)
	gap()
		
	gameStartFromTarget.call().add()
	gap()
	
	menuOkClickBreak.toggle_off()
}

mainMenuPlayAsRandom = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()

	playerType[WHITE].set(HUMAN_PLAYER)
	playerType[BLACK].set(ENGINE_PLAYER)
	gap()

	random(fn(() => {
		playerType[BLACK].set(HUMAN_PLAYER)
		playerType[WHITE].set(ENGINE_PLAYER)
	}), group(0), 50)
	gap()

	gameStartFromTarget.call().add()
	gap()
	
	menuOkClickBreak.toggle_off()
}

mainMenuColorPlayer = (selectableI, _arrow) => {
	let
		color = selectableI == MAIN_MENU_WHITE_PLAYER ? WHITE : BLACK,
		customGameColor = customGamePlayers[color]

	sfx.menuClick.call().add()
	shiftToggles(customGameColor)
}

mainMenuPlayCustomGame = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()

	for (let color of colorsIter)
	for (let player of playerTypesIter) {
		grouped(customGamePlayers[color][player])
		playerType[color].set(player)
		grouped(customGamePlayers[color][player])
	}
	gap()

	gameStartFromTarget.call().add()
}

mainMenuBoardEditor = (_selectableI, arrow) => {
	fn(() => {
		grouped(mainMenu) //pause grouping
		grouped(arrow)
		sfx.menuClick.call().add()
		mainMenu.toggle_off()
		editMenu.toggle_on()

		UIPointerMenu.toggle_on()
		UIPointerBoard.toggle_off()
		
		cursorIdx.set(56)
		boardCursor.move_to(boardBlCorner)

		humanOn.set(T)
		gap()
		
		menuOkClickBreak.toggle_off()
		grouped(arrow)
		grouped(mainMenu) //resume grouping
	}).call().add()
}

mainMenuInitialBoard = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()
	targetPosReset.call().add()
}

mainMenuChess324Board = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()
	makeChess324Board()
}

mainMenuRandomizedGame = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()

	for (let color of colorsIter) {
		playerType[color].set(RANDOMER_PLAYER)
	}
	gap()
	
	gameStartFromTarget.call().add()
	gap()
	
	menuOkClickBreak.toggle_off()
}

mainMenuBlindfolded = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()
	shiftToggles(blindfoldedConfigs)
}

let
	stopScrolling = fn(() => {}),
	startScrolling = fn(() => {
		let timeToWait = 256

		sourceCodeUsed.set(T)
		code.toggle_on()
		spawn_trigger(stopScrolling, timeToWait).add()

		codeScroll.move(
			0,
			scrappedLineHeight * scrapped.length / 2.9 + scrappedYStart,
			timeToWait,
			NONE,
			2,
			1,
			1,
			true,
			false,
		)
	})

stopScrolling.ext(() => {
	sourceCodeUsed.set(F)
	startScrolling.stop()
	code.toggle_off()
	codeScroll.move_to(guide)
})

mainMenuShowSourceCode = (_selectableI, _arrow) => {
	sfx.menuClick.call().add()
	
	pComp(
		sourceCodeUsed, EQ, T,
		stopScrolling,
		startScrolling,
	).add()
}

mainMenuBeatLevel = (_selectableI, _arrow) => {
	pComp(
		beatLevelCounter, EQ, 0,
		fn(() => {
			end(true, true, true)
			sfx.finish.call().add()
		}),
		sfx.error,
	).add()
}

mainMenuOkClick = (selectableI, arrow) => {
	let selectableActions = [
		[[MAIN_MENU_PLAY_AS_WHITE, MAIN_MENU_PLAY_AS_BLACK], mainMenuPlayAsColor],
		[[MAIN_MENU_PLAY_AS_RANDOM], mainMenuPlayAsRandom],
		[[MAIN_MENU_WHITE_PLAYER, MAIN_MENU_BLACK_PLAYER], mainMenuColorPlayer],
		[[MAIN_MENU_PLAY_CUSTOM_GAME], mainMenuPlayCustomGame],
		[[MAIN_MENU_BOARD_EDITOR], mainMenuBoardEditor],
		[[MAIN_MENU_INITIAL_BOARD], mainMenuInitialBoard],
		[[MAIN_MENU_CHESS324_BOARD], mainMenuChess324Board],
		[[MAIN_MENU_RANDOMIZED_GAME], mainMenuRandomizedGame],
		[[MAIN_MENU_BLINDFOLDED], mainMenuBlindfolded],
		[[MAIN_MENU_SHOW_SOURCE_CODE], mainMenuShowSourceCode],
		[[MAIN_MENU_BEAT_LEVEL], mainMenuBeatLevel],
	]

	for (let [selectables, callback] of selectableActions) {
		if (selectables.includes(selectableI)) {
			callback(selectableI, arrow)
		}
	}
}

editMenuSaveAndGoBack = (_selectableI, arrow) => {
	fn(() => {
		targetTurn.set(WHITE)
		moveGenBreak.toggle_on()
		gap()

		let
			configsFromMenuI = (menuI) => editMenuSettingConfigs[
				editMenuSettings.findIndex((setting) => setting.menuI == menuI)
			],
			editMenuTurnConfigs = configsFromMenuI(EDIT_MENU_TURN),
			editMenuEnPassantConfigs = configsFromMenuI(EDIT_MENU_EN_PASSANT),
			editMenuCastleConfigs = [
				configsFromMenuI(EDIT_MENU_WHITE_CASTLE),
				configsFromMenuI(EDIT_MENU_BLACK_CASTLE),
			]

		grouped(editMenuTurnConfigs[1])
		targetTurn.add(1)
		grouped(editMenuTurnConfigs[1])

		//put en-passant
		for (let configI in editMenuEnPassantConfigs) {
			let config = editMenuEnPassantConfigs[configI]

			if (configI > 0) {
				grouped(config)
				targetPos.enPassant.add(+configI)
				grouped(config)
			}
		}
		gap()

		//fill table with on
		for (let castlingCheckTmp of castlingCheckTmps) {
			castlingCheckTmp.toggle_on()
		}
		gap()

		//put (inversed) casling rights in 0..4 of the table
		for (let color of colorsIter) {
			let castleConfigs = editMenuCastleConfigs[color]

			for (let configI in castleConfigs) {
				let config = castleConfigs[configI]

				grouped(config)
				for (let castle of castlingsIter) {
					if (configI & (1 << castle)) {
						castlingCheckTmps[color * 2 + castle].toggle_off()
					}
				}
				grouped(config)
			}
		}
		gap()

		//inverse 0..4 of the table and result in 4..8
		for (let i of range(4)) {
			let
				from = castlingCheckTmps[i],
				to = castlingCheckTmps[i + 4]

			grouped(from)
			to.toggle_off()
			grouped(from)
		}
		gap()

		//turn off rights that dont match the board
		for (let color of colorsIter) {
			for (let castle of castlingsIter) {
				let
					payload = [castlingCheckTmps[color * 2  + castle + 4], false], //payload to turn off this castle
					castleRookPlace = (oppositeColor(color)) * 8 * 7 + castle * 7,
					colorRook = color == WHITE ? til.r : til.R

				//if one value doesn't match turn off the rights
				for (let comp of [LARGER_THAN, SMALLER_THAN]) {
					targetPos.kings[color].if_is(comp, initKingPos[color], ...payload)
					targetPos.tiles[castleRookPlace].if_is(comp, colorRook, ...payload)
				}
			}
		}

		for (let castling of targetPos.castling) {
			castling.set(F)
		}
		gap()

		//convert bit table to castle rights
		for (let i of range(4)) {
			let bit = castlingCheckTmps[i + 4]

			grouped(bit)
			targetPos.castling[i].set(T)
			grouped(bit)
		}

		targetPos.enPassant.set(NO_ENPASSANT)
		gap()

		let
			notValidEnPassant = fn(() => {
				targetPos.enPassant.set(NO_ENPASSANT)
			}),
			//check en-passant pawn is in its place, otherwise remove en-passant
			checkEnPassantPawn = (color) => {
				let matchPiece = color == WHITE ? til.P : til.p

				//assume there is no any pawns by filling the table with on
				for (let i of range(8)) {
					enPassantPieceCheckTmps[i].toggle_on()
				}
				gap()

				//deactivate table part where there is a pawn
				for (let i of range(8)) {
					let payload = [enPassantPieceCheckTmps[i], false]
					targetPos.tiles[3 * 8 + color * 8 + i].if_is(EQUAL_TO, matchPiece, ...payload)
				}
				gap()

				for (let i of range(8)) {
					//there is not a pawn here, if this is the en-passant column remove it
					grouped(enPassantPieceCheckTmps[i])
					targetPos.enPassant.if_is(EQUAL_TO, i, notValidEnPassant)
					grouped(enPassantPieceCheckTmps[i])
				}
			}
		
		pComp(targetTurn, EQ, WHITE,
			fn(() => { //WHITE
				checkEnPassantPawn(WHITE)
				gap()

				remapInto(checkNode[BLACK], objFilter(nodeA, positionFilter), targetPos).call().add()
			}),
			fn(() => { //BLACK
				checkEnPassantPawn(BLACK)
				gap()

				//from targetPos create a contrary board and copy it into nodes[1], so gameStart catches it
				copyInvertedBoard(nodeA, targetPos)
				gap()
			
				checkNode[BLACK].call().add()
			}),
		).add()
		gap()

		grouped(moveGenBreak) //off if king in check
		grouped(editMenu) //pause grouping
		grouped(arrow)
		sfx.menuClick.call().add()
		mainMenu.toggle_on()
		editMenu.toggle_off()

		UIPointerMenu.toggle_on()
		UIPointerBoard.toggle_off()

		humanOn.set(F)
		grouped(arrow)
		grouped(editMenu) //resume grouping
		grouped(moveGenBreak) //off if king in check
		gap()

		humanOn.if_is(EQUAL_TO, T, sfx.error)
	}).call().add()
}

editMenuOkClick = (selectableI, arrow) => {
	let isSetting = false

	for (let settingI in editMenuSettings) {
		if (editMenuSettings[settingI].menuI == selectableI) {
			shiftToggles(editMenuSettingConfigs[settingI])
			sfx.menuClick.call().add()
			isSetting = true
		}
	}

	switch (selectableI) {
	case EDIT_MENU_SAVE_AND_GO_BACK:
		editMenuSaveAndGoBack(selectableI, arrow)
		break

	default:
		if (!isSetting) {
			sfx.error.call().add()
		}
	}
}

gameMenuPromotionOkClick = (selectableI, _arrow) => {
	sfx.menuClick.call().add()

	let promotionSelected = tmpC[4] //to doPromotionMove
	promotionSelected.set(selectableI)
}

gameMenuPromotionOkPost = () => {
	doPromotionMove.call().add()
}

menuOkClick.ext(() => {
	menuOkClickBreak.toggle_on()
	gap()
	
	grouped(menuOkClickBreak)

	//edit menu & main menu

	let selectableMenus = [
		{
			groups: [mainMenu],
			arrows: mainMenuArrows,
			clickFn: mainMenuOkClick,
		},
		{
			groups: [editMenu],
			arrows: editMenuArrows,
			clickFn: editMenuOkClick,
		},
		{
			groups: [gameMenu, gameMenuPromotion],
			arrows: gameMenuPromotionArrows,
			clickFn: gameMenuPromotionOkClick,
			postFn: gameMenuPromotionOkPost,
		},
	]

	for (let selectableMenu of selectableMenus) {
		selectableMenu.groups.forEach(grouped)
		for (let selectableI in selectableMenu.arrows) {
			let arrow = selectableMenu.arrows[selectableI]

			grouped(arrow)
			selectableMenu.clickFn(+selectableI, arrow)
			grouped(arrow)
			gap()
		}

		if (selectableMenu.postFn !== undefined) {
			selectableMenu.postFn()
			gap()
		}

		menuOkClickBreak.toggle_off()
		selectableMenu.groups.forEach(grouped)
		gap()
	}

	//game menu

	let conds = [gameMenu, gameMenuMove, UIPointerMenu]

	conds.forEach(grouped)
	sfx.menuClick.call().add()
	gap()

	gameQuit.call().add()

	//doesnt break as in this case is unnecesary, but usually would do
	//i leave the code to illustrate the idea
	//gap()
	//
	//menuOkClickBreak.toggle_off()
	conds.forEach(grouped)

	grouped(menuOkClickBreak)
})

selClick.ext(() => {
	let isInAMenu = tmpG[0]

	isInAMenu.toggle_off()
	gap()

	for (let menu of [gameMenu, editMenu]) {
		grouped(menu)
		isInAMenu.toggle_on()
		grouped(menu)
	}
	gap()

	inBoardInMenuShift = fn(() => {
		shiftToggles([UIPointerMenu, UIPointerBoard], SHIFT_RIGHT, tmpG[1])
		sfx.menuShift.call().add()
	})

	let inBoardInMenuShiftConditions = [ //[conditions, callback]
		[[gameMenu, gameMenuMove, isInAMenu, gameMenuGameResultOff], undefined],
		...Object.values(editMenuPieces)
			.map((selectableI) => {
				let arrow = editMenuArrows[selectableI]

				return [
					[editMenu, arrow],
					() => {
						if (Object.values(editMenuBlackPieces).includes(selectableI)) {
							setCursorColor(BLACK)
						} else {
							setCursorColor(WHITE)
						}
					},
				]
			}),
	]

	for (let [condition, callback] of inBoardInMenuShiftConditions) {
		condition.forEach(grouped)
		inBoardInMenuShift.call().add()
		if (callback !== undefined) {
			callback()
		}
		condition.forEach(grouped)
	}

	let inBoardInMenuShiftFailConditions = [
		[mainMenu],
		[gameMenu, gameMenuGameResultOn],
		...Object.values(editMenuNonPieces)
			.map((selectableI) => [editMenu, editMenuArrows[selectableI]]),
	]

	for (let condition of inBoardInMenuShiftFailConditions) {
		condition.forEach(grouped)
		sfx.error.call().add()
		condition.forEach(grouped)
	}
})