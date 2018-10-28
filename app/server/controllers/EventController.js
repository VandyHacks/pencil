// bad name: covers JS Event
const Event = require('../models/Event');
const UserController = require('./UserController');

const EventController = {};

EventController.createEvent = (name, open, eventType, callback) => {
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
    .findOne({ name })
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
        event.eventType = eventType;
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
 * @param  {String}   EVENT_ID    Event id
 * @param  {String}   attendee User id
 * @param  {Function} callback args(err, event)
 */
EventController.addAttendee = function (EVENT_ID, attendee, callback) {
  UserController.getById(attendee, (err, user) => {
    if (err) {
      return callback(err);
    }

    if (!user) {
      return callback({ message: 'Not a valid ID' });
    }

    // check if user is already checked into that event
    Event.findOne({
      _id: EVENT_ID, open: true
    }, (err, event) => {
      if (err) {
        return callback(err);
      }
      const ids = event.attendees.map(e => e.attendee.toString());
      if (event.type !== 'Meal' && // prevent multiple attendance, EXCEPT for meals (so we can track who gets seconds)
        ids.indexOf(attendee) > -1) {
        return callback({ message: 'User already checked in to this event.', id: attendee });
      }
      // if not already in event, add to event
      Event.update({
        _id: EVENT_ID, open: true
      }, {
        $push: {
          attendees: { attendee }
        }
      }, {
        new: true
      },
      (err, res) => {
        return err ? callback(err, res) : callback(null, attendee);
      });
    });
  });
};

/**
 * Set user as not attending the event
 * @param  {String}   event    Event id
 * @param  {String}   attendee User id
 * @param  {Function} callback args(err, event)
 */
EventController.removeAttendee = (event, attendee, callback) => {
  Event.update({
    _id: event
  }, {
    $pull: { // if no such attendee, this does nothing
      attendees: { attendee }
    }
  },
  (err, res) => {
    return err ? callback(err, res) : callback(null, attendee);
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
    $set: { open: open } // should be { open } but wasn't working
  }, {
    projection: { 'open': 1 },
    returnNewDocument: true
  },
  callback);
};

/**
 * Get all events' info, not attendees for lazy loading (probably unnessary)
 * @param  {Function} callback args(err, event)
 */
EventController.getEvents = (callback) => {
  Event.find({}, 'name _id open eventType attendees', (err, data) => {
    if (err) {
      callback(err, data);
    } else {
      const out = [];
      for (const event of data) {
        const eventObj = JSON.parse(JSON.stringify(event));
        eventObj.attendees = event.attendees.length;
        out.push(eventObj);
      }
      callback(err, out);
    }
  });
};

/**
 * Get all event types
 * @param  {Function} callback args(err, types)
 */
EventController.getTypes = (callback) => {
  callback(null, Event.schema.path('eventType').enumValues);
};

/**
 * Get attendees for event
 * @param  {String}   id       Event id
 * @param  {Function} callback args(err, users)
 */
EventController.getAttendees = (id, callback) => {
  Event.findById(id)
    .populate('attendees.attendee', 'profile.name email')
    .exec(callback);
};

/**
 * Get attendees for event, all data included
 * @param  {String}   id       Event id
 * @param  {Function} callback args(err, users)
 */
EventController.getAttendeeDump = (id, callback) => {
  Event.findById(id)
    .populate('attendees.attendee')
    .exec(callback);
};

module.exports = EventController;
