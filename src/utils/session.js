app.get("/demo-session", function (req, res, next) {
  if (req.session.views) {
    req.session.views++
    res.setHeader("Content-Type", "text/html")
    res.write("<p>views: " + req.session.views + "</p>")
    res.write("<p>expires in: " + req.session.cookie.maxAge / 1000 + "s</p>")
    res.end()
  } else {
    req.session.views = 1
    res.end("welcome to the session demo. refresh!")
  }
})

//set session
app.get("/set_session", (req, res) => {
  //set a object to session
  req.session.User = {
    website: "anonystick.com",
    type: "blog javascript",
    like: "4550",
  }

  return res.status(200).json({ status: "success" })
})

//set session
app.get("/get_session", (req, res) => {
  //check session
  if (req.session.User) {
    return res
      .status(200)
      .json({ status: "success", session: req.session.User })
  }
  return res.status(200).json({ status: "error", session: "No session" })
})

//Delete session
app.get("/destroy_session", (req, res) => {
  // req.session.views = ""
  // return res.status(200).json({ status: "success" })
  //destroy session
  req.session.destroy(function (err) {
    return res
      .status(200)
      .json({ status: "success", session: "cannot access session here" })
  })
})
