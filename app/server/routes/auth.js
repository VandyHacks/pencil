const UserController = require('../controllers/UserController');
const cors = require('cors');
const corsOpts = require('./cors');

module.exports = function (router) {
  // ---------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------

  /**
   * Login a user with a username (email) and password.
   * Find em', check em'.
   * Pass them an authentication token on success.
   * Otherwise, 401. You fucked up.
   *
   * body {
   *  email: email,
   *  password: password
   *  token: ?
   * }
   *
   */
  router.post('/login', (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const token = req.body.token;

    if (token) {
      UserController.loginWithToken(token, (err, token, user) => {
        if (err || !user) {
          if (err) {
            console.log(err);
          }
          return res.status(400).send(err);
        }
        return res.json({
          token: token,
          user: user
        });
      });
    } else {
      UserController.loginWithPassword(email, password, (err, token, user) => {
        if (err || !user) {
          if (err) {
            console.log(err);
          }
          return res.status(400).send(err);
        }
        return res.json({
          token: token,
          user: user
        });
      });
    }
  });

  /**
   * Register a user with a username (email) and password.
   * If it already exists, then don't register, duh.
   *
   * body {
   *  email: email,
   *  password: password
   * }
   *
   */
  router.post('/register', (req, res, next) => {
    // Register with an email and password
    const email = req.body.email;
    const password = req.body.password;

    UserController.createUser(email, password, (err, user) => {
      if (err) {
        if (err) {
          console.log(err);
        }
        return res.status(400).send(err);
      }
      return res.json(user);
    });
  });

  router.post('/reset', (req, res, next) => {
    const email = req.body.email;

    UserController.sendPasswordResetEmail(email, (err) => {
      if (err) {
        if (err) {
          console.log(err);
        }
        return res.status(400).send(err);
      }
      return res.json({
        message: 'Email Sent'
      });
    });
  });

  /**
   * Reset user's password.
   * {
   *   token: STRING
   *   password: STRING,
   * }
   */
  router.post('/reset/password', (req, res) => {
    const pass = req.body.password;
    const token = req.body.token;

    UserController.resetPassword(token, pass, (err, user) => {
      if (err || !user) {
        if (err) {
          console.log(err);
        }
        return res.status(400).send(err);
      }
      return res.json(user);
    });
  });

  /**
   * Resend a password verification email for this user.
   *
   * body {
   *   id: user id
   * }
   */
  router.post('/verify/resend', (req, res, next) => {
    const id = req.body.id;
    if (id) {
      UserController.sendVerificationEmailById(id, (err, user) => {
        if (err || !user) {
          if (err) {
            console.log(err);
          }
          return res.status(400).send();
        }
        return res.status(200).send();
      });
    } else {
      return res.status(400).send();
    }
  });

  /**
   * Verify a user with a given token.
   */
  router.get('/verify/:token', (req, res, next) => {
    console.log('VERIFY USER TOKEN PAGE REACHED.');
    const token = req.params.token;
    UserController.verifyByToken(token, (err, user) => {
      if (err) {
        console.log(err);
      }
      if (err || !user) {
        return res.status(400).send(err);
      }

      return res.json(user);
    });
  });

  /**
   * Verify an apicode before checking attendees into an event
   */
  router.options('/eventcode', cors(corsOpts));
  router.post('/eventcode', cors(corsOpts), (req, res, next) => {
    const token = req.body.token;
    console.log(req.body);
    console.log('token: ' + token);
    console.log('token type: ' + typeof token);
    console.log('secret: ' + process.env.API_SECRET);
    console.log('secret type: ' + typeof process.env.API_SECRET);

    res.status((token === process.env.API_SECRET) ? 200 : 400).send();
  });
};
