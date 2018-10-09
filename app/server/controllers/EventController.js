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
 * @param  {String}   id       Event id
 * @param  {String}   attendee User id
 * @param  {Function} callback args(err, event)
 */
EventController.addAttendee = function (id, attendee, callback) {
  UserController.getById(attendee, (err, user) => {
    if (err) {
      return callback(err);
    }

    if (!user) {
      return callback({ message: 'Not a valid ID' });
    }

    Event.update({
      _id: id, open: true, 'attendees.attendee': { $ne: attendee }
    }, {
      $addToSet: {
        attendees: { attendee } // unique? maybe
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * Set user as not attending the event
 * @param  {String}   id       Event id
 * @param  {String}   attendee User id
 * @param  {Function} callback args(err, event)
 */
EventController.removeAttendee = (event, attendee, callback) => {
  Event.update({
    _id: event
  }, {
    $pull: {
      attendees: { attendee }
    }
  },
  callback);
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

EventController.admittedToEvent = (user, event, callback) => {
  Event.findById(event, (err, event) => {
    if (err) {
      return callback(err);
    }

    if (!event) {
      return callback({ message: 'Not a valid event' });
    }

    const admitted = event.attendees.some(attendee => {
      console.log(attendee);
      console.log('user ' + user);
      console.log('attendee type ' + typeof attendee.attendee);

      return attendee.attendee.toString() === user;
    });

    UserController.getById(user, (err, model) => {
      if (err) {
        return callback(err);
      }

      if (!model) {
        return callback({ message: 'Not a valid user' });
      }

      const modelCopy = JSON.parse(JSON.stringify(model));
      modelCopy.admittedToEvent = admitted;
      return callback(null, modelCopy);
    });
  });
};

module.exports = EventController;
