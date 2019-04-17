const Docker = require("dockerode");
Promise = require("bluebird");
const path = require("path");
let docker = Promise.promisifyAll(new Docker());
const {runCommand} = require("./runner_util");
let image;

async function main() {
	let container;
	let dir = path.resolve(process.cwd());
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
		await container.startAsync();
		containerStream.pipe(process.stdout);
		let ret = await runCommand(container, ["./core/core.bin", "1", (256 * 1024 * 1024).toString(), (64 * 1024 * 1024).toString(), (256 * 1024 * 1024).toString(), "./data/1.in", "./data/1.user", "", "./source/test"]);
		container.remove({
			force: true
		});
		console.log(ret);
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

main();