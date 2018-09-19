const corsOptions = {
  origin: function (origin, callback) {
    if (origin === undefined || origin.endsWith('.vandyhacks.org') || origin.endsWith('netlify.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

module.exports = corsOptions;
