const spawn = require("child_process").spawn;
async function main() {
	const thread = spawn("docker", ["run", "--rm", "-v", process.cwd() + ":/home", "-w", "/home",
	"gcc:latest", "g++", "-o", "core/core.bin", "core/core.cpp","-O2","-lpthread"]);
	thread.stdout.on("data", (e) => console.log(e.toString()));
	thread.stderr.on("data", (e) => console.log(e.toString()));
}

main();