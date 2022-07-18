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
    html: `<body>Ấn vào đây để thay đổi: <a href=${url}>CHANGE PASSWORD</a></body>`,
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
    subject: "Ê mày là chủ tài khoản à? Mới có thằng đầu buồi nào đó đổi á",
    html: `<body>Đúng rồi tao đây: <a href=${url}>ẤN VÀO EM ĐI CHỦ NHÂN</a></body>`,
  };

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error);
    console.log(body);
  });
};

module.exports = { resetPassword, verifyAccount };
