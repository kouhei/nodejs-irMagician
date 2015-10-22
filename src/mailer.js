var SendMail = function (toAddress, myAddress, myPassword) {
  'use strict';
  this.color = require('./color');
  this.mailer = require('nodemailer');

  if (!myAddress) {
    throw this.color.error('mailer : myAddress is not defined!');
  } else {
    this.myAddress = myAddress;
    console.log(myAddress);
  }
  if (!myPassword) {
    throw this.color.error('mailer : myPassword is not defined!');
  } else {
    this.myPassword = myPassword;
    console.log(myPassword);
  }
  if (!toAddress) {
    throw this.color.error('mailer : toAddress is not defined!');
  } else {
    this.toAddress = toAddress;
    console.log(toAddress);
  }

    this.setting = {
      service: 'Gmail',
      ssl: true,
      use_authentication: true,
      auth: {
        user: this.myAddress,
        pass: this.myPassword
      }
    };
};

SendMail.prototype = {
  send: function (message) {
    'use strict';
    var self = this,
    // SMTPの接続
      transporter = this.mailer.createTransport('SMTP', this.setting),
      mailOptions = {
        from: this.myAddress,
        to: this.toAddress,
        subject: 'Inform from doorSensor',
        html: '<p>' + message + '</p>'
      };
    // メールの送信
    transporter.sendMail(mailOptions, function (err, res) {
      if (err) {
        // 送信に失敗したとき
        console.log(err);
      } else {
        // 送信に成功したとき
        console.log(self.color.safe('sending mail to ' + self.toAddress));
      }
      // SMTPの切断
      transporter.close();
    });
  }
};

module.exports = SendMail;
