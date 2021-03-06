const { promisify } = require('util');
const UserController = require('../controllers/UserController');
const EventController = require('../controllers/EventController');
const SettingsController = require('../controllers/SettingsController');

const User = require('../models/User');
const multer = require('multer');
const uploadHelper = require('../services/uploadhelper');
const cors = require('cors');
const corsOpts = require('./cors');
const fetch = require('node-fetch');
const querystring = require('querystring');

const REDCAP_API_TOKEN = process.env.REDCAP_API_TOKEN;

module.exports = function (router) {
  function getToken(req) {
    return req.headers['x-access-token'];
  }

  /**
   * Using the access token provided, check to make sure that
   * you are, indeed, an admin.
   */
  function isAdmin(req, res, next) {
    const token = getToken(req);

    UserController.getByToken(token, (err, user) => {
      if (err) {
        return res.status(500).send(err);
      }

      if (user && user.admin) {
        req.user = user;
        return next();
      }

      return res.status(401).send({
        message: 'Get outta here, punk!'
      });
    });
  }

  /**
   * Using event secret provided, check that secret is
   * the correct one (for nfc-scanner)
   */
  function isValidSecret(req, res, next) {
    if (!req.header('x-event-secret')) {
      return isAdmin(req, res, next);
    }

    if (req.header('x-event-secret') === process.env.API_SECRET) {
      return next();
    } else {
      return res.status(401).send({
        message: 'Invalid event API secret'
      });
    }
  }

  /**
   * [Users API Only]
   *
   * Check that the id param matches the id encoded in the
   * access token provided.
   *
   * That, or you're the admin, so you can do whatever you
   * want I suppose!
   */
  function isOwnerOrAdmin(req, res, next) {
    const token = getToken(req);
    const userId = req.params.id;

    UserController.getByToken(token, (err, user) => {
      if (err || !user) {
        return res.status(500).send(err);
      }

      if (user.admin) {
        req.isUserAdmin = true;
        return next();
      }

      if (user._id.toString() === userId) {
        return next();
      }

      return res.status(400).send({
        message: 'Token does not match user id.'
      });
    });
  }

  /**
   * Default response to send an error and the data.
   * @param  {[type]} res [description]
   * @return {[Function]}     [description]
   */
  function defaultResponse(req, res) {
    return function (err, data) {
      if (err || !data) {
        if (err) {
          console.error(err);
        }
        console.log('data: ', data);
        return res.status(400).send({ error: err });
      } else {
        return res.json(data);
      }
    };
  }

  /**
   *  API!
   */

  // ---------------------------------------------
  // Users
  // ---------------------------------------------

  /**
   * [ADMIN ONLY]
   *
   * GET - Get all users, or a page at a time.
   * ex. Paginate with ?page=0&size=100
   */
  router.get('/users', isAdmin, (req, res) => {
    const query = req.query;
    const resumeURL = 'https://s3.amazonaws.com/' + process.env.BUCKET_NAME;

    const addFields = async function (err, data) {
      if (err) {
        defaultResponse(req, res)(err);
        return;
      }
      data = await JSON.parse(JSON.stringify(data));
      await data.users.forEach(user => {
        if (user.profile.lastResumeName) {
          user.profile.resumePath = resumeURL + '/' + user.profile.lastResumeName;
        }
      });
      defaultResponse(req, res)(null, data);
    };

    if (query.page && query.size) {
      UserController.getPage(query, addFields);
    } else {
      // should realistically never happen
      UserController.getAll(false, addFields);
    }
  });

  /**
   * GET - Get all users, with condensed information
   * Used for NFC front-end site, to reduce frequent server requests
   */
  router.options('/users/condensed', cors(corsOpts)); // for CORS preflight
  router.get('/users/condensed', cors(corsOpts), isValidSecret, (req, res) => {
    const addFields = async function (err, data) {
      if (err) {
        defaultResponse(req, res)(err);
        return;
      }
      data = await JSON.parse(JSON.stringify(data));
      if (!data || !data.users) {
        defaultResponse(req, res)({ message: 'No users found.' });
        return;
      }
      const statusOf = user => {
        const status = user.status;
        let result = (status.completedProfile ? '' : 'Not ') + 'Submitted.';
        if (status.admitted) {
          result = 'Admitted.';
        }
        if (status.confirmed) {
          result = 'Confirmed.';
        }
        if (status.declined) {
          result = 'Declined.';
        }
        return result;
      };
      data.users = await data.users.map(user => (
        {
          name: user.profile.name || 'Unknown',
          school: user.profile.school || 'Unknown',
          email: user.email || 'Unknown',
          id: user.id,
          status: statusOf(user),
          hasBusTicket: user.status.hasBusTicket
        }));
      defaultResponse(req, res)(null, data);
    };
    // get all submitted users
    UserController.getAll(true, addFields);
  });

  /**
   * GET - Get all user phone numbers that are able for SMS notifs
   * Used for NFC front-end site, to reduce frequent server requests
   */
  router.options('/users/phoneNums', cors(corsOpts)); // for CORS preflight
  router.get('/users/phoneNums', cors(corsOpts), isValidSecret, (req, res) => {
    // callback handler
    const addFields = async function (err, data) {
      if (err) {
        defaultResponse(req, res)(err);
        return;
      }
      // data = await JSON.parse(JSON.stringify(data));
      console.log(data);
      data.users = data.attendees;
      if (!data || !data.users) {
        defaultResponse(req, res)({ message: 'No users found.' });
        return;
      }
      const normalizePhoneNumber = phoneNumberString => {
        const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          const intlCode = (match[1] ? '+1 ' : '');
          return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
        }
        return null;
      };
      const filteredUsers = await data.users.filter(
        user => user.confirmation && // note: walkin are not confirmed but still have phone nums
                user.confirmation.smsPermission); // only get phone numbers w/ permission
      data.users = await filteredUsers.map(user => (
        {
          email: user.email || 'Unknown',
          phoneNumber: normalizePhoneNumber(user.confirmation.phoneNumber.trim()) || 'Bad format.',
          id: user.id
        }));
      defaultResponse(req, res)(null, data);
    };
    // get all checked-in users
    EventController.getEvents((err, events) => {
      if (err) {
        return defaultResponse(req, res)(err, null);
      }
      events = events.filter(e => e.eventType === 'CheckIn');
      if (events.length === 0) {
        return defaultResponse(req, res)(err, null);
      }
      // 1. get first instance of check-in event, get all attendees
      return EventController.getAttendeePhoneNumbers(events[0]._id, addFields);
    });
  });

  /**
   * [ADMIN ONLY]
   */
  router.get('/users/stats', isAdmin, (req, res) => {
    UserController.getStats(defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * GET - Get a specific user.
   */
  router.get('/users/:id', isOwnerOrAdmin, (req, res) => {
    const id = req.params.id;
    UserController.getById(id, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * GET - Checks whether a specific user signed the Redcap waiver form.
   */
  router.get('/users/:id/signedwaiver', (req, res) => {
    const id = req.params.id;
    // find user
    UserController.getById(id, (err, data) => {
      if (err) {
        defaultResponse(req, res)(err, null);
      }
      // get email
      const email = data.email;
      const params = {
        token: REDCAP_API_TOKEN,
        content: 'record',
        format: 'json',
        type: 'flat'
      };
      // check that they actually signed
      fetch('https://redcap.vanderbilt.edu/api/', {
        method: 'POST',
        body: querystring.stringify(params),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
        .then(res => res.json())
        .then(data => {
          const users = data.filter(e => e.email.toLowerCase() === email.toLowerCase() && e.signature_field.length > 0);
          if (users.length > 0) {
            defaultResponse(req, res)(null, users);
          } else {
            defaultResponse(req, res)({ error: 'No matching signed waivers found.' }, null);
          }
        })
        .catch(err => {
          console.log(err);
          defaultResponse(req, res)(err, null);
        });
    });
  });

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's profile.
   */
  router.put('/users/:id/profile', isOwnerOrAdmin, (req, res) => {
    const profile = req.body.profile;
    const id = req.params.id;

    UserController.updateProfileById(id, profile, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * PUT - Update a specific user's confirmation information.
   */
  router.put('/users/:id/confirm', isOwnerOrAdmin, (req, res) => {
    const confirmation = req.body.confirmation;
    const id = req.params.id;

    UserController.updateConfirmationById(id, confirmation, defaultResponse(req, res));
  });

  /**
   * [OWNER/ADMIN]
   *
   * POST - Decline an acceptance.
   */
  router.post('/users/:id/decline', isOwnerOrAdmin, (req, res) => {
    const id = req.params.id;

    UserController.declineById(id, defaultResponse(req, res));
  });

  const resumeUpload = multer({
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'application/msword', // doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/vnd.oasis.opendocument.text', // odt
        'application/x-iwork-pages-sffpages', // pages
        'application/pdf' // pdf
      ];

      if (allowedMimeTypes.includes(file.mimetype)) cb(null, true); // Accept file
      else cb(null, false); // Reject file
    },
    limits: {
      fileSize: 2 * 1000 * 1000 // 2 MB
    },
    storage: multer.memoryStorage()
  });

  /**
   * [OWNER/ADMIN]
   *
   * POST - Upload a resume for the specified user.
   */
  router.post('/users/:id/resume', isOwnerOrAdmin, resumeUpload.single('file'), (req, res) => {
    const file = req.file;
    const id = req.params.id; // unique user_id

    const formData = uploadHelper.generateOpts(id, file.mimetype);
    formData.file = {
      value: file.buffer,
      options: {
        filename: file.originalname,
        contentType: file.mimetype
      }
    };

    const uniquefilename = id + '_' + file.originalname;

    uploadHelper.uploadToS3(uniquefilename, file.buffer, file.mimetype, (err, data) => {
      if (err) {
        defaultResponse(req, res)(err);
      } else {
        UserController.updateLastResumeNameById(id, data.filename, (err, data) => {
          if (err) {
            defaultResponse(req, res)(err);
          } else {
            defaultResponse(req, res)(null, {
              message: 'Upload succeeded'
            });
          }
        });
      }
    });
  });

  /**
   * Get a user's team member's names. Uses the code associated
   * with the user making the request.
   */
  router.get('/users/:id/team', isOwnerOrAdmin, (req, res) => {
    const id = req.params.id;
    UserController.getTeammates(id, defaultResponse(req, res));
  });

  /**
   * Create a teamcode. Create a team here.
   * {
   *   code: STRING
   * }
   */
  router.post('/users/:id/team', isOwnerOrAdmin, (req, res) => {
    const code = req.body.code;
    const id = req.params.id;

    UserController.createTeam(id, code, defaultResponse(req, res));
  });

  /**
   * Create a walkin user and updates user's profile.
   */
  router.options('/walkin/profile', cors(corsOpts));
  router.post('/walkin/profile', cors(corsOpts), isValidSecret, (req, res) => {
    console.log('Creating new walk-in user.');

    // create a new user and updates its fields
    const u = new User();
    u.email = req.body.email.toLowerCase();
    u.password = User.generateHash(123345);
    u.profile.gender = req.body.gender;
    u.profile.name = req.body.name;
    u.profile.school = req.body.school;
    u.profile.year = req.body.year;
    u.confirmation.phoneNumber = req.body.phone;
    u.status.completedProfile = true;
    u.profile.isWalkin = true;

    UserController.createWalkinUser(u, defaultResponse(req, res));
  });

  /**
   * Update a teamcode. Join a team here.
   */
  router.put('/users/:id/team', isOwnerOrAdmin, (req, res) => {
    const code = req.body.code;
    const id = req.params.id;

    UserController.joinTeam(id, code, defaultResponse(req, res));
  });

  /**
   * Remove a user from a team.
   */
  router.delete('/users/:id/team', isOwnerOrAdmin, (req, res) => {
    const id = req.params.id;

    UserController.leaveTeam(id, defaultResponse(req, res));
  });

  /**
   * Admit a user. ADMIN ONLY
   */
  router.post('/users/:id/admit', isAdmin, (req, res) => {
    // Accept the hacker. Admin only
    const id = req.params.id;
    const acceptAsMentor = req.query.mentor;
    const user = req.user;
    UserController.admitUser(id, user, acceptAsMentor, defaultResponse(req, res));
  });

  // admits all users fitting query
  router.post('/users/admitall', isAdmin, (req, res) => {
    const query = req.body.querytext;
    console.log('Admitting all users, query= ' + query);
    UserController.admitAll(query, defaultResponse(req, res));
  });

  /**
   * Associates a NFC code for a User (pairing). ADMIN ONLY
   */
  router.options('/users/:id/NFC', cors(corsOpts)); // for CORS preflight
  router.put('/users/:id/NFC', cors(corsOpts), isValidSecret, (req, res) => {
    const id = req.params.id;
    const code = req.body.code;

    UserController.setNFC(id, code, defaultResponse(req, res));
  });

  // ---------------------------------------------
  // Settings [ADMIN ONLY!]
  // ---------------------------------------------

  /**
   * Get the public settings.
   * res: {
   *   timeOpen: Number,
   *   timeClose: Number,
   *   timeToConfirm: Number,
   *   acceptanceText: String,
   *   confirmationText: String
   * }
   */
  router.get('/settings', (req, res) => {
    SettingsController.getPublicSettings(defaultResponse(req, res));
  });

  /**
   * Update the acceptance text.
   */
  router.put('/settings/waitlist', isAdmin, (req, res) => {
    const text = req.body.text;
    SettingsController.updateField('waitlistText', text, defaultResponse(req, res));
  });

  /**
   * Update the acceptance text.
   */
  router.put('/settings/acceptance', isAdmin, (req, res) => {
    const text = req.body.text;
    SettingsController.updateField('acceptanceText', text, defaultResponse(req, res));
  });

  /**
   * Update the confirmation text.
   */
  router.put('/settings/confirmation', isAdmin, (req, res) => {
    const text = req.body.text;
    SettingsController.updateField('confirmationText', text, defaultResponse(req, res));
  });

  /**
   * Update the confirmation date.
   * body: {
   *   time: Number
   * }
   */
  router.put('/settings/confirm-by', isAdmin, (req, res) => {
    const time = req.body.time;
    SettingsController.updateField('timeConfirm', time, defaultResponse(req, res));
  });

  /**
   * Set the registration open and close times.
   * body : {
   *   timeOpen: Number,
   *   timeClose: Number
   * }
   */
  router.put('/settings/times', isAdmin, (req, res) => {
    const open = req.body.timeOpen;
    const close = req.body.timeClose;
    SettingsController.updateRegistrationTimes(open, close, defaultResponse(req, res));
  });

  /**
   * Get the whitelisted emails.
   *
   * res: {
   *   emails: [String]
   * }
   */
  router.get('/settings/whitelist', isAdmin, (req, res) => {
    SettingsController.getWhitelistedEmails(defaultResponse(req, res));
  });

  /**
   * [ADMIN ONLY]
   * {
   *   emails: [String]
   * }
   * res: Settings
   *
   */
  router.put('/settings/whitelist', isAdmin, (req, res) => {
    const emails = req.body.emails;
    SettingsController.updateWhitelistedEmails(emails, defaultResponse(req, res));
  });

  // ---------------------------------------------
  // Events [ADMIN ONLY!]
  // excepting getting events
  // ---------------------------------------------

  /**
   * Create a new event
   */
  router.post('/events', isAdmin, (req, res) => {
    // Register with an email and password
    const name = req.body.name;
    const open = req.body.open;
    const type = req.body.type;

    EventController.createEvent(name, open, type, (err, user) => {
      if (err) {
        return res.status(400).send(err);
      }
      return res.json(user);
    });
  });

  /**
   * Get events list (public)
   */
  router.get('/events', cors({ origin: true }), (req, res) => {
    EventController.getEvents(defaultResponse(req, res));
  });

  /**
   * Get event types (public)
   */
  router.get('/events/types', cors({ origin: true }), (req, res) => {
    EventController.getTypes(defaultResponse(req, res));
  });

  /**
   * Get event info and attendees (do not get tendies)
   */
  router.get('/events/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    EventController.getAttendees(id, defaultResponse(req, res));
  });

  /**
   * Get event info and attendees (also get tendies)
   */
  router.get('/events/dump/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    EventController.getAttendeeDump(id, defaultResponse(req, res));
  });

  function doEventAction(eventid, attendeeid, idtype, action, responseCallback) {
    // type is either 'id' or 'nfc', default is 'id'
    const getIDAsync = idtype === 'nfc'
      ? promisify(UserController.getIDfromNFC)(attendeeid)
      : Promise.resolve({ id: attendeeid });

    getIDAsync
      .then(data => {
        console.log(data);
        attendeeid = data.id;
        action(eventid, attendeeid, responseCallback);
      })
      .catch(err => {
        responseCallback(err, null);
      });
  }

  /**
   * Add user to event
   */
  router.options('/events/:eventid/admit/:attendeeid', cors(corsOpts)); // for CORS preflight
  router.get('/events/:eventid/admit/:attendeeid', cors(corsOpts), isValidSecret, (req, res) => {
    const { eventid, attendeeid } = req.params;
    doEventAction(eventid, attendeeid, req.query.type, EventController.addAttendee, defaultResponse(req, res));
  });

  /**
   * Remove user from event
   */
  router.options('/events/:eventid/unadmit/:attendeeid', cors(corsOpts)); // for CORS preflight
  router.get('/events/:eventid/unadmit/:attendeeid', cors(corsOpts), isValidSecret, (req, res) => {
    const { eventid, attendeeid } = req.params;
    doEventAction(eventid, attendeeid, req.query.type, EventController.removeAttendee, defaultResponse(req, res));
  });

  /**
   * Change open status of event
   */
  router.put('/events/:eventid/open', isAdmin, (req, res) => {
    const event = req.params.eventid;
    const open = req.body.open;

    EventController.setOpen(event, open, defaultResponse(req, res));
  });
};
