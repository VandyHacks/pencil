const Settings = require('../app/server/models/Settings');

Settings
  .findOne({})
  .exec((err, settings) => {
    if (!settings) {
      settings = new Settings();
      settings.save();
    }
  });
