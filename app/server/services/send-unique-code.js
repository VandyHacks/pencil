const mailgun = require('mailgun-js')({ apiKey: process.env.MG_API_KEY, domain: 'vandyhacks.org' });
const UserController = require('../controllers/UserController');

const getCode = id => {
  // TODO: replace this with actual short code lol
  return UserController.getMockCode(id);
};

const baseData = () => {
  return {
    from: 'VandyHacks <info@vandyhacks.org>',
    subject: 'VandyHacks V - Important information regarding check-in'
  };
};

module.exports = (email, id) => {
  mailgun.messages().send(Object.assign(baseData(), {
    to: email,
    text: `We're excited to have you at VandyHacks V! 
    
    Please keep track of your following unique code: ${getCode(id)}
    
    Please present this code to us to check into the event.
    In addition, you may need this code for any workshops, and any meals throughout the weekend.

See you soon!

All the best,
The VandyHacks Team`
  }), (err, body) => {
    if (err) {
      console.log(err);
    } else {
      console.log(body);
    }
  });
};
