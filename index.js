engineStepsPerTick = 1 //how fast the engine thinks (too high numbers can cause lag)
engineThinkTicks = 5 * 240 //amount of ticks the engine thinks per move
engineFirstDepth = 1 //the first depth the engine will search for
engineMinDepth = 3 //engine will not stop before this depth
engineMaxDepth = 5 //max depth the engine can think
engineOrdererRecordLength = 24 //how many childs of root can the engine sort
zobristRecordLength = 64 //how many board hashs can the game remembers
beatLevelDelay = 5 * 60 //how many seconds the user waits until being able to beat the level

let oldRequire = require
require = (arg) => {
	console.log(arg, "=>", global["unavailable_g"] ?? 0)
	oldRequire(arg)
}

//initialize
;[
	"@g-js-api/g.js",
	"./utilities",
	"./colouring",
	"./parseItem",
	"./boardNodes",
	"./evaluationLookup",
	"./objectMapper",
	"./codeScrapper",
	"./initializer",
	"./soundEffects",
	"./zobrist",
	"./moveOrdering",
	"./analysis",
	"./nodeEvaluator",
	"./moveGenerator",
	"./userInterface",
	"./UIManipulation",
	"./interaction",
	"./game",
	"./userInputs",
	"./tickLoop",
	"./figure",
	"./logger",
].forEach(require)

//export
$.exportConfig({
	type: 'savefile',
	options: {
		info: true,
	},
})