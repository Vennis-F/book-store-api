const jwt = require("jsonwebtoken")
const User = require("../models/user")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ")[1]
    const decode = await jwt.verify(token, "SEC_JWT")
    const user = await User.findOne({ _id: decode._id, "tokens.token": token })

    //Check user not exist
    if (!user) throw new Error()

    req.user = user
    req.token = token
    next()
  } catch (e) {
    //Case: Not token, not valid token, user not found(jwt not valid)
    res.status(401).send({ error: "Please authenticate" })
  }
}

module.exports = auth
