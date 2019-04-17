const GNU = require("./GNU/GNU");
const path = require("path");
module.exports = async function main(dir, fileName) {
	dir = path.resolve(dir);
	return await GNU(dir, fileName, "cc", 11, "g++");
};