const mailgun = require('mailgun-js')({ apiKey: process.env.MG_API_KEY, domain: 'vandyhacks.org' });
const qr = require('qr-image');

const getQr = data => qr.image(data, { type: 'png', size: 240, margin: 16 });

const baseData = () => {
  return {
    from: 'VandyHacks <info@vandyhacks.org>',
    subject: 'VandyHacks IV - Important information regarding check-in',
    text: '420 blaze it'
  };
};

module.exports = email => {
  mailgun.messages().send(Object.assign(baseData(), {
    to: email,
    attachment: getQr('598a494939ffb9001f4b95dd')
  }), (err, body) => {
    if (err) {
      console.log(err);
    } else {
      console.log(body);
    }
  });
};
