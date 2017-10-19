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

  attendees: [{
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, required: true, default: Date.now }
  }]
});

module.exports = mongoose.model('Event', schema);
