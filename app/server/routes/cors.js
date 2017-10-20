const corsOptions = {
  origin: function (origin, callback) {
    if (origin.endsWith('.vandyhacks.org')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

module.exports = corsOptions;
