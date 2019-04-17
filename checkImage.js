const Docker = require("dockerode");
Promise = require("bluebird");
let docker = Promise.promisifyAll(new Docker());
let image;
module.exports = async function(imageName) {
	image = Promise.promisifyAll(docker.getImage(imageName));
	try {
		await image.inspectAsync();
	}
	catch (e) {
		console.log("Fail to inspect image. Download from docker hub");
		await new Promise((resolve, reject) => {
			docker.pull(imageName, async (err, res) => {
				if(err) {
					reject(err);
				}
				while(true) {
					try {
						await image.inspectAsync();
						break;
					}
					catch (e) {
						await Promise.delay(1000);
					}
				}
			})
		})
	}
};