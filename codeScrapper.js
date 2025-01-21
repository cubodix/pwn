scrapCode = () => {
	let
		filesHere =
			fs
			.readdirSync(__dirname)
			.filter(file => path.extname(file) === ".js"),
		out = ""
	
	for (let file of filesHere) {
		let basename = path.basename(file)
		out += `\n\n/* ========= FILE: ${basename} ========= */\n\n`
		out += fs.readFileSync(file, "utf8")
	}

	//out = out.replace(/\n/g, "")
	out = out.replace(/\r/g, "")
	out = out.replace(/\t/g, "  ")

	return out.split("\n")
}