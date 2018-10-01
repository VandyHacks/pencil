const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const profile = {

  // Basic info
  name: {
    type: String,
    min: 1,
    max: 100
  },

  school: {
    type: String,
    min: 1,
    max: 250
  },

  graduationYear: {
    type: String,
    enum: {
      values: ['2018', '2019', '2020', '2021', '2022']
    }
  },

  firstHackathon: Boolean,

  gender: {
    type: String,
    enum: {
      values: 'M F O N'.split(' ')
    }
  },

  ethnicities: [String],

  essay: {
    type: String,
    min: 0,
    max: 2500
  },

  majors: String,
  resume: String,
  lastResumeName: {
    type: String,
    default: ''
  },
  github: String,
  devpost: String,
  linkedin: String,
  website: String,

  adult: {
    type: Boolean,
    required: true,
    default: false
  },
  volunteer: {
    type: Boolean,
    required: false,
    default: false
  },
  signatureCodeOfConduct: String

};

// Only after confirmed
const confirmation = {
  phoneNumber: String,
  dietaryRestrictions: [String],
  shirtSize: {
    type: String,
    enum: {
      values: 'XS S M L XL XXL WXS WS WM WL WXL WXXL'.split(' ')
    }
  },

  needsReimbursement: Boolean,
  address: {
    city: String,
    state: String,
    zip: String,
    country: String
  },

  notes: {
    type: String,
    min: 0,
    max: 2500
  }
};

const status = {
  /**
   * Whether or not the user's profile has been completed.
   * @type {Object}
   */
  completedProfile: {
    type: Boolean,
    required: true,
    default: false
  },
  admitted: {
    type: Boolean,
    required: true,
    default: false
  },
  admittedBy: {
    type: String,
    validate: [
      validator.isEmail,
      'Invalid Email'
    ],
    select: false
  },
  admittedOn: {
    type: Number
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false
  },
  declined: {
    type: Boolean,
    required: true,
    default: false
  },
  checkedIn: {
    type: Boolean,
    required: true,
    default: false
  },
  checkInTime: {
    type: Number
  },
  confirmBy: {
    type: Number
  },
  reimbursementGiven: {
    type: Boolean,
    default: false
  }
};

// define the schema for our admin model
const schema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    validate: [
      validator.isEmail,
      'Invalid Email'
    ]
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  admin: {
    type: Boolean,
    required: true,
    default: false
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now()
  },

  lastUpdated: {
    type: Number,
    default: Date.now()
  },

  teamCode: {
    type: String,
    min: 0,
    max: 140
  },

  NFC_code: {
    type: String
  },

  verified: {
    type: Boolean,
    required: true,
    default: false
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },

  /**
   * User Profile.
   *
   * This is the only part of the user that the user can edit.
   *
   * Profile validation will exist here.
   */
  profile: profile,

  /**
   * Confirmation information
   *
   * Extension of the user model, but can only be edited after acceptance.
   */
  confirmation: confirmation,

  status: status

});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

// =========================================
// Instance Methods
// =========================================

// checking if this password matches
schema.methods.checkPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Token stuff
schema.methods.generateEmailVerificationToken = function () {
  return jwt.sign({ email: this.email }, JWT_SECRET);
};

schema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this.id }, JWT_SECRET);
};

/**
 * Generate a temporary authentication token (for changing passwords)
 * @return JWT
 * payload: {
 *   id: userId
 *   iat: issued at ms
 *   exp: expiration ms
 * }
 */
schema.methods.generateTempAuthToken = function () {
  return jwt.sign({
    _id: this.id
  }, JWT_SECRET, {
    expiresIn: '1h'
  });
};

// =========================================
// Static Methods
// =========================================

schema.statics.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

/**
 * Verify an an email verification token.
 * @param  {String}   token token
 * @param  {Function} cb    args(err, email)
 */
schema.statics.verifyEmailVerificationToken = function (token, callback) {
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
    }
    return callback(err, decoded.email);
  });
};

/**
 * Verify a temporary authentication token.
 * @param  {String}   token    temporary auth token
 * @param  {Function} callback args(err, id)
 */
schema.statics.verifyTempAuthToken = function (token, callback) {
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err || !payload) {
      console.log(err);
      return callback(err);
    }

    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return callback({
        message: 'Token has expired.'
      });
    }

    return callback(null, payload._id);
  });
};

schema.statics.findOneByEmail = function (email) {
  return this.findOne({
    email: new RegExp('^' + email + '$', 'i')
  });
};

/**
 * Get a single user using a signed token.
 * @param  {String}   token    User's authentication token.
 * @param  {Function} callback args(err, user)
 */
schema.statics.getByToken = function (token, callback) {
  jwt.verify(token, JWT_SECRET, (err, id) => {
    if (err) {
      console.log(err);
      return callback(err);
    }
    this.findOne({ _id: id }, callback);
  });
};

schema.statics.validateProfile = function (profile, cb) {
  return cb(!(
    profile.name.length > 0 &&
    profile.adult &&
    profile.school.length > 0 &&
    ['2018', '2019', '2020', '2021', '2022'].indexOf(profile.graduationYear) > -1 &&
    ['M', 'F', 'O', 'N'].indexOf(profile.gender) > -1
  ));
};

// =========================================
// Virtuals
// =========================================

/**
 * Has the user completed their profile?
 * This provides a verbose explanation of their furthest state.
 */
schema.virtual('status.name').get(function () {
  if (this.status.checkedIn) {
    return 'checked in';
  }

  if (this.status.declined) {
    return 'declined';
  }

  if (this.status.confirmed) {
    return 'confirmed';
  }

  if (this.status.admitted) {
    return 'admitted';
  }

  if (this.status.completedProfile) {
    return 'submitted';
  }

  if (!this.verified) {
    return 'unverified';
  }

  return 'incomplete';
});

module.exports = mongoose.model('User', schema);
