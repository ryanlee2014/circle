const Docker = require("dockerode");
Promise = require("bluebird");
let docker = Promise.promisifyAll(new Docker());
const {runCommand} = require("../../runner/runner_util");
const path = require("path");

async function main(dir, fileName, fileSuffix = "cc", version = 17, language = "g++") {
	dir = path.resolve(dir);
	let c_or_cpp = language === "g++" ? "++": "";
	await require("../../checkImage")("gcc:latest");
	const COMPILE_COMMAND = ["timeout", "0", "g++", "-fmax-errors=10", "-fno-asm", "-Wall", "-O2", "-lm", `-std=c${c_or_cpp}${version}`, "-DONLINE_JUDGE", "-o", fileName, `${fileName}.${fileSuffix}`];
	let container;
	try {
		container = await docker.createContainerAsync({
			Image: "gcc:latest",
			Cmd: ["/bin/sh", "-c", "while true; do sleep 1; done;"],
			HostConfig: {
				NetworkMode: "none",
				Memory: 256 * 1024 * 1024,
				Binds: [`${dir}:/opt:rw`],
				CpusetCpus: "1"
			},
			WorkingDir: "/opt",
			Volumes: {
				"/opt": {}
			},
			NetworkDisabled: true
		});
		Promise.promisifyAll(container);
		const containerStream = await container.attachAsync({stream: true, stdout: true, stderr: true});
		containerStream.pipe(process.stdout);
		await container.startAsync();
		//await Running(container);
		let ret;
		//let ret = await runCommand(container, ["/bin/sh", "-c", "echo test"]);
		ret = await runCommand(container, COMPILE_COMMAND);
		//ret = await runCommand(container, ["./test"]);
		container.remove({
			force: true
		});
		return true;
	}
	catch (e) {
		console.log(e);
		container.remove({
			force: true
		});
		return false;
	}
}

module.exports = main;
