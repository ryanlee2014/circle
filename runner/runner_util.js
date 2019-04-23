const utils = {};
utils.containerWrapper = function (_container) {
	let container;
	if(!_container.State && typeof _container.Running !== "undefined") {
		container = {State: _container}
	}
	else {
		container = _container;
	}
	return container;
};

utils.wait = async function(_container) {
	let container = utils.containerWrapper(_container);
	let runDaemon = utils.containerWrapper(await container.inspectAsync());
	while(runDaemon.State.Running) {
		Promise.delay(100);
		runDaemon = utils.containerWrapper(await container.inspectAsync());
	}
	return runDaemon.State.ExitCode;
};

/**
 * @return {boolean}
 */
utils.Running = async function(container) {
	let runDaemon = await container.inspectAsync();
	while(!runDaemon.State.Running) {
		Promise.delay(100);
		runDaemon = await container.inspectAsync();
	}
	return true;
};

utils.runCommand = async function(container, command) {
	let exec = await container.execAsync({
		Cmd: command,
		AttachStdout: true,
		AttachStderr: true
	});
	Promise.promisifyAll(exec);
	container.modem.demuxStream(await exec.startAsync(), process.stdout, process.stderr);
	return await utils.wait(exec);
};

module.exports = utils;