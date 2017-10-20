const mailgun = require('mailgun-js')({ apiKey: process.env.MG_API_KEY, domain: 'vandyhacks.org' });
const qr = require('qr-image');

const getQr = data => qr.imageSync(data, { type: 'png', size: 10, margin: 4 });

const baseData = () => {
  return {
    from: 'VandyHacks <info@vandyhacks.org>',
    subject: 'VandyHacks IV - Important information regarding check-in'
  };
};

module.exports = (email, id) => {
  mailgun.messages().send(Object.assign(baseData(), {
    to: email,
    text: `We're excited to have you at VandyHacks IV! Please download the attached QR code to your phone before you arrive tomorrow evening; it'll be required to check into the event, any workshops, and any meals throughout the weekend. If you don't have it downloaded prior to check-in, you may be asked to go through the line again, so please come prepared!

See you tomorrow!

All the best,
The VandyHacks Team`,
    attachment: new mailgun.Attachment({
      data: getQr(id),
      filename: 'vh-checkin-code.png',
      contentType: 'image/png'
    })
  }), (err, body) => {
    if (err) {
      console.log(err);
    } else {
      console.log(body);
    }
  });
};
