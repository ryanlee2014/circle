const Docker = require("dockerode");
Promise = require("bluebird");
let docker = Promise.promisifyAll(new Docker());
module.exports = async function(ImageName, BindDir) {
	let container = await docker.createContainerAsync({
		Image: ImageName,
		Cmd: ["/bin/sh", "-c", "while true; do sleep 1; done;"],
		HostConfig: {
			NetworkMode: "none",
			Memory: 256 * 1024 * 1024,
			Binds: [`${BindDir}:/opt:rw`],
			CpusetCpus: "1"
		},
		WorkingDir: "/opt",
		Volumes: {
			"/opt": {}
		},
		NetworkDisabled: true
	});
	return Promise.promisifyAll(container);
};