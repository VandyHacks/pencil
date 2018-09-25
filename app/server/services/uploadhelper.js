const crypto = require('crypto');
const mime = require('mime');
const AWS = require('aws-sdk');

const BUCKET_NAME = process.env.BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

const secret = process.env.FILESTORE_SECRET;

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
  return sha1sum(id + secret) + extname.toLowerCase();
}

function getFilePathByMime(id, contentType) {
  return getFilePathByExt(id, '.' + mime.getExtension(contentType));
}

function uploadToS3(filename, filedata, filetype, callback) {
  const s3 = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    Bucket: BUCKET_NAME
  });
  s3.createBucket(() => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: filedata,
      ContentType: filetype
    };
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return callback(err);
      }
      console.log(`success: uploaded ${filename} to s3.`);
      return callback(null, data);
    });
  });
}

function generateOpts(id, contentType) {
  const opts = {
    path: getFilePathByMime(id, contentType)
  };
  opts.signature = getSignature(opts);
  return opts;
}

module.exports = {
  getFilePathByExt,
  getFilePathByMime,
  uploadToS3,
  generateOpts
};
