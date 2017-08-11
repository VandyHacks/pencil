const crypto = require('crypto');
const path = require('path');

function sha1sum(content) {
    return crypto.createHash('sha1').update(content).digest('hex');
}

function getSignature(opts, secretKey) {
	let verification = '';
	for (let key of Object.keys(opts).sort()) {
		verification += key + '=' + opts[key] + '&';
	}
	verification += ('secret=' + secretKey);
	return crypto.createHash('sha1').update(verification).digest('hex');
}

module.exports = {
    getUploadUrl() {
        return process.env.STOREHOUSE_URL;
    },
    generateOpts(id, filename, fileStream) {
        const secret = process.env.STOREHOUSE_SECRET
        const opts = {
            path: `resumes/${sha1sum(id + secret)}.${path.extname(originalName)}`
        };
        opts.signature = getSignature(opts, secret);
        opts.file = fileStream;
        return opts;
    }
}