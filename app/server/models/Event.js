const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  open: {
    type: Boolean,
    required: true,
    default: true
  },

  // don't name as 'type', bc may shadow other vars
  eventType: {
    type: String,
    // don't rename these, other places in code depend on exact spelling
    enum: ['CheckIn', 'Meal', 'Tech Talk', 'Fun', 'Ceremony', 'Misc.'],
    required: true,
    default: 'Misc.'
  },

  attendees: [{
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, required: true, default: Date.now }
  }]
});

module.exports = mongoose.model('Event', schema);
