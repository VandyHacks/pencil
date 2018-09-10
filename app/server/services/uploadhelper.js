const crypto = require('crypto');
const mime = require('mime');

const secret = process.env.STOREHOUSE_SECRET;

function sha1sum(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

function getSignature(opts) {
  let verification = '';
  for (const key of Object.keys(opts).sort()) {
    verification += key + '=' + opts[key] + '&';
  }
  verification += ('secret=' + secret);
  return crypto.createHash('sha1').update(verification).digest('hex');
}

function getFilePathByExt(id, extname) {
  return 'resumes/' + sha1sum(id + secret) + extname.toLowerCase();
}

function getFilePathByMime(id, contentType) {
  return getFilePathByExt(id, '.' + mime.getExtension(contentType));
}

module.exports = {
  getUploadUrl() {
    return process.env.STOREHOUSE_URL;
  },
  getFilePathByExt: getFilePathByExt,
  getFilePathByMime: getFilePathByMime,
  generateOpts(id, contentType) {
    const opts = {
      path: getFilePathByMime(id, contentType)
    };
    opts.signature = getSignature(opts);
    return opts;
  }
};
