const mailgun = require("mailgun-js");
const DOMAIN = "sandboxdb4d80514b9740a59c707461d54b325b.mailgun.org";
const API_MAILGUN = "718e5aacfea107b7f21b85d9abebe5ab-18e06deb-66da586b";
const mg = mailgun({ apiKey: API_MAILGUN, domain: DOMAIN });

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
