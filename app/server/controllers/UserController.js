const User = require('../models/User');
const Settings = require('../models/Settings');
const Mailer = require('../services/email');
const Stats = require('../services/stats');

const validator = require('validator');
const moment = require('moment');

const UserController = {};

const maxTeamSize = process.env.TEAM_MAX_SIZE || 4;
const minPasswordLength = 6;
const maxPasswordLength = 60;

/**
 * Determine whether or not a user can register.
 * @param  {String}   email    Email of the user
 * @param  {Function} callback args(err, true, false)
 * @return {[type]}            [description]
 */
function canRegister(email, password, callback) {
  if (!password || password.length < minPasswordLength) {
    return callback({ message: `Password must be ${minPasswordLength} or more characters.` }, false);
  } else if (password.length > maxPasswordLength) {
    return callback({ message: `Password cannot be longer than ${maxPasswordLength} characters.` }, false);
  }

  // Check if its within the registration window.
  Settings.getRegistrationTimes((err, times) => {
    if (err) {
      callback(err);
    }

    const now = Date.now();

    if (now < times.timeOpen) {
      return callback({
        message: 'Registration opens in ' + moment(times.timeOpen).fromNow() + '!'
      });
    }

    if (now > times.timeClose) {
      return callback({
        message: 'Sorry, registration is closed.'
      });
    }

    // Check for emails.
    Settings.getWhitelistedEmails((err, emails) => {
      if (err || !emails) {
        return callback(err);
      }
      const isEmailValid = validator.isEmail(email);
      console.log(email, emails);
      for (const whitelistedSuffix of emails) {
        if (isEmailValid && email.endsWith(whitelistedSuffix)) {
          return callback(null, true);
        }
      }
      return callback({
        message: 'Email must be a valid school email.'
      }, false);
    });
  });
}

/**
 * Login a user given a token
 * @param  {String}   token    auth token
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithToken = function (token, callback) {
  User.getByToken(token, (err, user) => {
    return callback(err, token, user);
  });
};

/**
 * Login a user given an email and password.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithPassword = function (email, password, callback) {
  if (!password || password.length === 0) {
    return callback({
      message: 'Please enter a password'
    });
  }

  if (!validator.isEmail(email)) {
    return callback({
      message: 'Invalid email'
    });
  }

  User
    .findOneByEmail(email)
    .select('+password')
    .exec((err, user) => {
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback({
          message: "We couldn't find that account!"
        });
      }
      if (!user.checkPassword(password)) {
        return callback({
          message: "That's not the right password."
        });
      }

      // yo dope nice login here's a token for your troubles
      const token = user.generateAuthToken();

      const u = user.toJSON();

      delete u.password;

      return callback(null, token, u);
    });
};

/**
 * Create a new user given an email and a password.
 * @param  {String}   email    User's email.
 * @param  {String}   password [description]
 * @param  {Function} callback args(err, user)
 */
UserController.createUser = function (email, password, callback) {
  if (typeof email !== 'string') {
    return callback({
      message: 'You must provide a valid email.'
    });
  }

  email = email.toLowerCase();

  // Check that there isn't a user with this email already.
  canRegister(email, password, (err, valid) => {
    if (err || !valid) {
      return callback(err);
    }

    User
      .findOneByEmail(email)
      .exec((err, user) => {
        if (err) {
          return callback(err);
        }

        if (user) {
          return callback({
            message: 'An account for this email already exists.'
          });
        } else {
          // Make a new user
          const u = new User();
          u.email = email;
          u.password = User.generateHash(password);
          u.save((err) => {
            if (err) {
              return callback(err);
            }

            // yay! success.
            const token = u.generateAuthToken();

            // Send over a verification email
            const verificationToken = u.generateEmailVerificationToken();
            Mailer.sendVerificationEmail(email, verificationToken);

            return callback(null,
              {
                token: token,
                user: u
              });
          });
        }
      });
  });
};

/**
 * Returns the ID of the user corresponding to an NFC code
 * @param {String} nfcCode
 * @param {Function} callback
 */
UserController.getIDfromNFC = function (nfcCode, callback) {
  // the find query finds all users that has ever had that nfc code
  return User.find({ NFC_codes: nfcCode }, (err, data) => {
    if (err) {
      return callback(err, null);
    }
    if (!data) {
      return callback({ error: 'No users found.' }, null);
    }
    // actually find who had that wristband last (currently)
    const users = data.filter(user => user.NFC_codes[user.NFC_codes.length - 1] === nfcCode);
    if (users.length === 0) {
      return callback({ error: 'No users found.' }, null);
    }
    const result = { id: users[0].id };
    return callback(err, result);
  });
};

/**
 * Returns a user given an auth token
 * @param {String} token
 * @param {Function} callback
 */
UserController.getByToken = function (token, callback) {
  User.getByToken(token, callback);
};

/**
 * Get all users.
 * It's going to be a lot of data, so make sure you want to do this.
 * @param {Boolean} onlySubmitted
 * @param  {Function} callback args(err, user)
 */
UserController.getAll = function (onlySubmitted, callback) {
  let findQuery = {};
  if (onlySubmitted === true) {
    findQuery = { 'status.completedProfile': true };
  }
  return User.find(findQuery, (err, data) => {
    const result = { users: data };
    return callback(err, result);
  });
};

/**
 * Get a page of users.
 * @param  {[type]}   page     page number
 * @param  {[type]}   size     size of the page
 * @param  {Function} callback args(err, {users, page, totalPages})
 */
UserController.getPage = function (query, callback) {
  const page = query.page;
  const size = parseInt(query.size);
  const findQuery = this.makeQuery(query.text, query.showUnsubmitted, query.showAdmitted);

  User
    .find(findQuery)
    .sort({
      'profile.name': 'asc'
    })
    .select('+status.admittedBy')
    .skip(page * size)
    .limit(size)
    .exec((err, users) => {
      if (err || !users) {
        return callback(err);
      }
      User.count(findQuery).exec((err, count) => {
        if (err) {
          return callback(err);
        }
        const data = {
          users: users,
          page: page,
          size: size,
          count: count,
          totalPages: Math.ceil(count / size)
        };
        return callback(null, data);
      });
    });
};

// Makes a query with a search text
UserController.makeQuery = function (searchText, showUnsubmitted, showAdmitted) {
  const findQuery = { $and: [{}] };
  if (searchText && searchText.length > 0) {
    const queries = [];
    const re = new RegExp(searchText, 'i');
    queries.push({ email: re });
    queries.push({ 'profile.name': re });
    // queries.push({ 'teamCode': re });
    queries.push({ 'profile.school': re });
    queries.push({ 'profile.graduationYear': re });
    findQuery.$and = [ { $or: queries } ];
  }
  if (showUnsubmitted === 'false') {
    findQuery.$and.push({ 'status.completedProfile': true });
  }
  if (showAdmitted === 'false') {
    findQuery.$and.push({ 'status.admitted': false });
  }
  return findQuery;
};

// Admits all uses on the page
UserController.admitAll = function (searchText, callback) {
  const query = this.makeQuery(searchText);
  User
    .find(query)
    .exec((err, users) => {
      if (err || !users) {
        return callback(err);
      }
      User.count(query).exec((err, count) => {
        if (err) {
          return callback(err);
        }
        const data = {
          count: count
        };
        return callback(null, data);
      });
    });
};

/**
 * Get a user by id.
 * @param  {String}   id       User id
 * @param  {Function} callback args(err, user)
 */
UserController.getById = function (id, callback) {
  User.findById(id, callback);
};

/**
 * Update a user's profile object, given an id and a profile.
 *
 * @param  {String}   id       Id of the user
 * @param  {Object}   profile  Profile object
 * @param  {Function} callback Callback with args (err, user)
 */
UserController.updateProfileById = function (id, profile, callback) {
  // Validate the user profile, and mark the user as profile completed
  // when successful.
  User.validateProfile(profile, (err) => {
    if (err) {
      return callback({ message: 'invalid profile' });
    }

    // Check if its within the registration window.
    Settings.getRegistrationTimes((err, times) => {
      if (err) {
        callback(err);
      }

      const now = Date.now();

      if (now < times.timeOpen) {
        return callback({
          message: 'Registration opens in ' + moment(times.timeOpen).fromNow() + '!'
        });
      }

      if (now > times.timeClose) {
        return callback({
          message: 'Sorry, registration is closed.'
        });
      }
    });

    // kinda hacky
    if (!profile.lastResumeName.startsWith(id + '_')) {
      profile.lastResumeName = id + '_' + profile.lastResumeName;
    }

    User.findOneAndUpdate({
      _id: id,
      verified: true
    },
    {
      $set: {
        'lastUpdated': Date.now(),
        'profile': profile,
        'status.completedProfile': true
      }
    },
    {
      new: true
    },
    callback);
  });
};

/**
 * Update a user's lastResumeName, given an id and a lastResumeName.
 *
 * @param  {String}   id              Id of the user
 * @param  {String}   lastResumeName  lastResumeName string
 * @param  {Function} callback        Callback with args (err, user)
 */
UserController.updateLastResumeNameById = function (id, newResumeName, callback) {
  // Validate the lastResumeName
  if (!newResumeName || newResumeName.length === 0) {
    return callback({ message: 'invalid lastResumeName' });
  }

  // Check if its within the registration window.
  Settings.getRegistrationTimes((err, times) => {
    if (err) {
      callback(err);
    }

    const now = Date.now();

    if (now < times.timeOpen) {
      return callback({
        message: 'Registration opens in ' + moment(times.timeOpen).fromNow() + '!'
      });
    }

    if (now > times.timeClose) {
      return callback({
        message: 'Sorry, registration is closed.'
      });
    }
  });

  console.log(`Updating lastResumeName of ${id} to ${newResumeName}`);
  User.findOneAndUpdate(
    {
      _id: id,
      verified: true
    },
    {
      $set: {
        'lastUpdated': Date.now(),
        'profile.lastResumeName': newResumeName
      }
    },
    {
      new: true
    },
    callback);
};

/**
 * Update a user's confirmation object, given an id and a confirmation.
 *
 * @param  {String}   id            Id of the user
 * @param  {Object}   confirmation  Confirmation object
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.updateConfirmationById = function (id, confirmation, callback) {
  User.findById(id, (err, user) => {
    if (err || !user) {
      return callback(err);
    }

    // Make sure that the user followed the deadline, but if they're already confirmed
    // that's okay.
    if (Date.now() >= user.status.confirmBy && !user.status.confirmed) {
      return callback({
        message: "You've missed the confirmation deadline."
      });
    }

    // You can only confirm acceptance if you're admitted and haven't declined.
    User.findOneAndUpdate({
      '_id': id,
      'verified': true,
      'status.admitted': true,
      'status.declined': { $ne: true }
    },
    {
      $set: {
        'lastUpdated': Date.now(),
        'confirmation': confirmation,
        'status.confirmed': true
      }
    }, {
      new: true
    },
    (err, user) => {
      if (err) callback(err);
      callback(null, user);
    });
  });
};

/**
 * Decline an acceptance, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
UserController.declineById = function (id, callback) {
  // You can only decline if you've been accepted.
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.admitted': true,
    'status.declined': false
  },
  {
    $set: {
      'lastUpdated': Date.now(),
      'status.confirmed': false,
      'status.declined': true
    }
  }, {
    new: true
  },
  callback);
};

/**
 * Verify a user's email based on an email verification token.
 * @param  {[type]}   token    token
 * @param  {Function} callback args(err, user)
 */
UserController.verifyByToken = function (token, callback) {
  User.verifyEmailVerificationToken(token, (err, email) => {
    if (err) callback(err);
    User.findOneAndUpdate({
      email: new RegExp('^' + email + '$', 'i')
    }, {
      $set: {
        'verified': true
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * Get a specific user's teammates. NAMES ONLY.
 * @param  {String}   id       id of the user we're looking for.
 * @param  {Function} callback args(err, users)
 */
UserController.getTeammates = function (id, callback) {
  User.findById(id, (err, user) => {
    if (err || !user) {
      return callback(err, user);
    }

    const code = user.teamCode;

    if (!code) {
      return callback({
        message: "You're not on a team."
      });
    }

    User
      .find({
        teamCode: code
      })
      .select('profile.name')
      .exec(callback);
  });
};

/**
 * Given a team code and id, create a team.
 * @param  {String}   id       Id of the user creating
 * @param  {String}   code     Code of the proposed team
 * @param  {Function} callback args(err, users)
 */
UserController.createTeam = function (id, code, callback) {
  if (!code) {
    return callback({
      message: 'Please enter a team name.'
    });
  }

  if (typeof code !== 'string') {
    return callback({
      message: 'Get outta here, punk!'
    });
  }

  User.find({
    teamCode: code
  })
    .select('profile.name')
    .exec((err, users) => {
      if (err) callback(err);

      // Check to see if this team is creatable (0 members)
      if (users.length > 0) {
        return callback({
          message: 'Team already exists! Pick a different name.'
        });
      }

      // Otherwise, we can add that person to the team.
      User.findOneAndUpdate({
        _id: id,
        verified: true
      }, {
        $set: {
          teamCode: code
        }
      }, {
        new: true
      },
      callback);
    });
};

/**
 * Given a team code and id, join a team.
 * @param  {String}   id       Id of the user joining
 * @param  {String}   code     Team code
 * @param  {Function} callback args(err, users)
 */
UserController.joinTeam = function (id, code, callback) {
  if (!code) {
    return callback({
      message: 'Please enter a team name.'
    });
  }

  if (typeof code !== 'string') {
    return callback({
      message: 'Get outta here, punk!'
    });
  }

  User.find({
    teamCode: code
  })
    .select('profile.name')
    .exec((err, users) => {
      if (err) callback(err);

      // Check to see if this team exists
      if (users.length === 0) {
        return callback({
          message: 'Team doesn\'t exist yet. Either create the team or choose an existing team.'
        });
      }

      // Check to see if this team is joinable (< team max size)
      if (users.length >= maxTeamSize) {
        return callback({
          message: 'Team is full.'
        });
      }

      // Otherwise, we can add that person to the team.
      User.findOneAndUpdate({
        _id: id,
        verified: true
      }, {
        $set: {
          teamCode: code
        }
      }, {
        new: true
      },
      callback);
    });
};

/**
 * Given an id, remove them from any teams.
 * @param  {[type]}   id       Id of the user leaving
 * @param  {Function} callback args(err, user)
 */
UserController.leaveTeam = function (id, callback) {
  User.findOneAndUpdate({
    _id: id
  }, {
    $set: {
      teamCode: null
    }
  }, {
    new: true
  },
  callback);
};

/**
 * Resend an email verification email given a user id.
 */
UserController.sendVerificationEmailById = function (id, callback) {
  User.findOne(
    {
      _id: id,
      verified: false
    },
    (err, user) => {
      if (err || !user) {
        let errmsg = err;
        if (!err) {
          errmsg = 'ERROR: No user has this id, failed to send verification email.';
        }
        return callback(errmsg);
      }
      const token = user.generateEmailVerificationToken();
      Mailer.sendVerificationEmail(user.email, token, callback);
      return callback(err, user);
    });
};

/**
 * Password reset email
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
UserController.sendPasswordResetEmail = function (email, callback) {
  if (!email) {
    return callback({
      message: 'You must provide a valid email.'
    });
  }
  User
    .findOneByEmail(email)
    .exec((err, user) => {
      if (err || !user) {
        const errmsg = 'ERROR: User tried to reset password without creating account first.';
        return callback(errmsg);
      }

      const token = user.generateTempAuthToken();
      Mailer.sendPasswordResetEmail(email, token);
      return callback(null, {
        message: 'Password reset email sent.'
      });
    });
};

/**
 * Reset a user's password to a given password, given a authentication token.
 * @param  {String}   token       Authentication token
 * @param  {String}   password    New Password
 * @param  {Function} callback    args(err, user)
 */
UserController.resetPassword = function (token, password, callback) {
  if (!password || !token) {
    return callback({
      message: 'Bad arguments'
    });
  }

  if (password.length < minPasswordLength) {
    return callback({
      message: `Password must be ${minPasswordLength} or more characters.`
    });
  } else if (password.length > maxPasswordLength) {
    return callback({
      message: `Password cannot be longer than ${maxPasswordLength} characters.`
    });
  }

  User.verifyTempAuthToken(token, (err, id) => {
    if (err || !id) {
      return callback(err);
    }

    User
      .findOneAndUpdate({
        _id: id
      }, {
        $set: {
          password: User.generateHash(password)
        }
      }, (err, user) => {
        if (err || !user) {
          return callback(err);
        }

        Mailer.sendPasswordChangedEmail(user.email);
        return callback(null, {
          message: 'Password successfully reset!'
        });
      });
  });
};

/**
 * [ADMIN ONLY]
 *
 * Admit a user.
 * @param  {String}   userId   User id of the admit
 * @param  {String}   user     User doing the admitting
 * @param  {Function} callback args(err, user)
 */
UserController.admitUser = function (id, user, callback) {
  Settings.getRegistrationTimes((err, times) => {
    if (err) callback(err);
    User
      .findOneAndUpdate({
        _id: id,
        'status.completedProfile': true,
        verified: true
      }, {
        $set: {
          'status.admitted': true,
          'status.admittedBy': user.email,
          'status.admittedOn': Date.now(),
          'status.confirmBy': times.timeConfirm
        }
      }, {
        new: true
      },
      callback);
  });
};

/**
 * [ADMIN ONLY]
 */

UserController.getStats = function (callback) {
  return callback(null, Stats.getUserStats());
};

/**
 * [ADMIN ONLY]
 *
 * Associates a NFC code with user id
 * @param  {String}   id       Id of the user joining
 * @param  {String}   code     NFC code
 * @param  {Function} callback args(err, users)
 */
UserController.setNFC = function (id, code, callback) {
  if (!code) {
    return callback({
      message: 'Please provide a NFC code.'
    });
  }

  if (typeof code !== 'string') {
    return callback({
      message: 'Get outta here, punk!'
    });
  }

  User.findOneAndUpdate({
    _id: id,
    verified: true
  }, {
    $push: {
      NFC_codes: code
    }
  }, {
    new: true
  },
  callback);
};

module.exports = UserController;
