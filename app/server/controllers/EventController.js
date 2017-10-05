// bad name: covers JS Event
const Event = require('../models/Event');

const EventController = {};

/**
 * Get a event by id.
 * @param  {String}   id       Event id
 * @param  {Function} callback args(err, event)
 */
EventController.getById = function (id, callback) {
  Event.findById(id, callback);
};

/**
 * Set user as attending the event
 * @param  {String}   id       Event id
 * @param  {Function} callback args(err, event)
 */
EventController.addAttendee = function (id, attendee, callback) {
  Event.findOneAndUpdate({
    _id: id
  }, {
    $push: {
      attendees: attendee
    }
  }, {
    new: true
  },
    callback);
};

module.exports = EventController;
