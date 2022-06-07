const mailgun = require("mailgun-js")
const DOMAIN = "sandbox5d30c40077f64e8bbf96e9e769dbb2df.mailgun.org"
const mg = mailgun({
  apiKey: "...",
  domain: DOMAIN,
})

const resetPassword = (email) => {
  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${email}`,
    subject: "Bạn đã quên mật khẩu?",
    text: "Hãy click vào đây link để đổi mật khẩu. I love You, 3000 <3",
  }

  mg.messages().send(data, function (error, body) {
    if (error) return console.log(error.message)
    console.log(body)
  })
}

module.exports = { resetPassword }
