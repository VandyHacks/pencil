const mailgun = require('mailgun-js')({ apiKey: process.env.MG_API_KEY, domain: 'vandyhacks.org' });
const request = require('request');

const getQr = data => request(`https://chart.googleapis.com/chart?cht=qr&chl=${data}&chs=240x240&chld=L|0`);

const baseData = () => {
  return {
    from: 'VandyHacks <info@vandyhacks.org>',
    subject: 'VandyHacks IV - Important information regarding check-in',
    text: '420 blaze it'
  };
};

module.exports = email => {
  console.log(process.env.MG_API_KEY);
  mailgun.messages().send(Object.assign(baseData(), {
    to: email,
    attachment: getQr('598a593894537c001fae3dda')
  }), (err, body) => {
    if (err) {
      console.log(err);
    } else {
      console.log(body);
    }
  });
};
