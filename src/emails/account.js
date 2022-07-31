const mailgun = require("mailgun-js");

const mg = mailgun({
  apiKey: process.env.MAILGUN_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const resetPassword = (email, url) => {
  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${email}`,
    subject: "Bạn đã quên mật khẩu?",
    html: `<body>Ấn vào đây để thay đổi: <a href=${url}>ĐỔI MẬT KHẨU</a></body>`,
    // text: "Testing some Mailgun awesomness!",
  };

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error);
    console.log(body);
  });
};

const verifyAccount = (email, url) => {
  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${email}`,
    subject: "Xác nhận tài khoản bạn đăng ký?",
    html: `<body>Ấn vào đây để xác nhận: <a href=${url}>XÁC NHẬN</a></body>`,
  };

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error);
    console.log(body);
  });
};

const passwordNewAccount = (email, password) => {
  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${email}`,
    subject: "Đây là passowrd cho tài khoản của bạn",
    html: `Password: ${password}`,
  };

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error);
    console.log(body);
  });
};

const sendEmail = (data) => {
  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error);
    console.log(body);
  });
};

module.exports = {
  resetPassword,
  verifyAccount,
  passwordNewAccount,
  sendEmail,
};
