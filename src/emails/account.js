const mailgun = require("mailgun-js");
const DOMAIN = "sandbox18c9afa0c9ff40bab8b51a6913e12cc6.mailgun.org";
const mg = mailgun({
  apiKey: "dbc2bd5305cc0d7b3ac6bea4844f1414-18e06deb-3fe844bf",
  domain: DOMAIN,
});

const resetPassword = (email) => {
  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${email}`,
    subject: "Bạn đã quên mật khẩu?",
    html: '<html><body><button><a href="http://localhost:5000/forget-password">here</a></button></body></html>',
  };

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error.message);
    console.log(body);
  });
};

// resetPassword("hoanganhgo28062001@gmail.com");

module.exports = { resetPassword };
