const crypto = require('crypto');
const mime = require('mime');

const secret = process.env.STOREHOUSE_SECRET;

function sha1sum(content) {
    return crypto.createHash('sha1').update(content).digest('hex');
}

function getSignature(opts) {
	let verification = '';
	for (let key of Object.keys(opts).sort()) {
		verification += key + '=' + opts[key] + '&';
	}
	verification += ('secret=' + secret);
	return crypto.createHash('sha1').update(verification).digest('hex');
}

function getFilePath(id, contentType) {
    return `resumes/${sha1sum(id + secret)}.${mime.extension(contentType)}`;
}

module.exports = {
    getUploadUrl() {
        return process.env.STOREHOUSE_URL;
    },
    getFilePath(id, contentType) {
        return getFilePath(id, contentType);
    },
    generateOpts(id, contentType) {
        const opts = {
            path: getFilePath(id, contentType)
        };
        opts.signature = getSignature(opts, secret);
        return opts;
    }
}