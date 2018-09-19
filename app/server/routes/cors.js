const corsOptions = {
  origin: function (origin, callback) {
    if (origin === undefined || origin.endsWith('.vandyhacks.org') || origin.endsWith('connect-backend--vhf2018-qr-scanner.netlify.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

module.exports = corsOptions;
