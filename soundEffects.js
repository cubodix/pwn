let sfxsLookup = [
	//name, sfxId, volume
	["menuShift", 13193],
	["menuClick", 478],

	["boardShift", 13193],
	["boardClick", 478],

	["gameTurn", 6532],
	["gameStart", 22877],
	["gameEnd", 22878, 2],
	["gameCheck", 6490],
	["gameCapture", 13028],

	["finish", 9577],
	["error", 13170],
]

sfx = {}

for (let sfxI in sfxsLookup) {
	let
		[name, sfxId, ogVolume] = sfxsLookup[sfxI],
		volume = ogVolume ?? 100,
		repeatedIdx =
			sfxsLookup
			.slice(0, +sfxI)
			.map(([_name, sfxId, volume]) => [sfxId, volume])
			.indexOf([sfxId, volume])
	
	sfx[name] =
		repeatedIdx == -1 ?
			fn(() => {
				simpleSfx(sfxId, volume).add()
			}):
			sfxsLookup[repeatedIdx]
}