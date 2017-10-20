// bad name: covers JS Event
const Event = require('../models/Event');
const UserController = require('./UserController');

const EventController = {};

EventController.createEvent = (name, open, callback) => {
  if (!name) {
    return callback({
      message: 'You must provide a name.'
    });
  }

  /**
   * Create a new user given an email and a password.
   * @param  {String}   name      Event name
   * @param  {Boolean}  open      Event is open
   * @param  {Function} callback  args(err, event)
   */
  Event
    .findOne({name})
    .exec((err, found) => {
      if (err) {
        return callback(err);
      }

      if (found) {
        return callback({
          message: 'An event for this name already exists.'
        });
      } else {
        // Make a new user
        const event = new Event();
        event.name = name;
        event.open = open;
        event.save((err) => {
          if (err) {
            return callback(err);
          }

          return callback(null, event);
        });
      }
    });
};

/**
 * Set user as attending the event
 * @param  {String}   id       Event id
 * @param  {String}   attendee User id
 * @param  {Function} callback args(err, event)
 */
EventController.addAttendee = function (id, attendee, callback) {
  UserController.getById(attendee, (err, user) => {
    if (err) {
      callback(err);
    }

    if (!user) {
      callback({message: 'Not a valid ID'});
    }

    Event.update({
      _id: id, 'attendees.attendee': {$ne: attendee}
    }, {
      $addToSet: {
        attendees: {attendee}  // unique? maybe
      }
    }, {
      new: true
    },
      callback);
  });
};

/**
 * Change open status of event
 * @param {String}    id    Event id
 * @param {Boolean}   open  Open status
 * @param {Function}  callback  args(err, event)
 */
EventController.setOpen = (id, open, callback) => {
  Event.findOneAndUpdate({
    _id: id
  }, {
    $set: {open}
  }, {
    new: true
  },
    callback);
};

/**
 * Get all events' info, not attendees for lazy loading (probably unnessary)
 * @param  {Function} callback args(err, event)
 */
EventController.getEvents = (callback) => {
  Event.find({}, 'name _id open', callback);
};

/**
 * Get attendees for event
 * @param  {String}   id       Event id
 * @param  {Function} callback args(err, users)
 */
EventController.getAttendees = (id, callback) => {
  Event.findById(id)
    .populate('attendees', '_id name school confirmation.dietaryRestrictions')
    .exec(callback);
};

module.exports = EventController;
