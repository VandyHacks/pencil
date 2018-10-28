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

  // scared of using type, bc covering or something
  eventType: {
    type: String,
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
