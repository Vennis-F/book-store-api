const Role = require("../models/role");

const authorize =
  (...allowedRoles) =>
  async (req, res, next) => {
    //Test
    // console.log(`User role: ${req.role}`);
    // console.log(allowedRoles);
    // console.log(await Role.findOne({ name: allowedRoles[0] }));

    //Check req.role exist
    if (!req?.role) return res.sendStatus(401);

    //Check req.role is allowed
    const userRole = req.role;
    let arrayRoles = allowedRoles.map((role) => Role.findOne({ name: role }));
    arrayRoles = await Promise.all(arrayRoles);
    // console.log(arrayRoles);
    arrayRoles = arrayRoles.map((role) => role.code);
    // console.log(arrayRoles);

    const check = arrayRoles.includes(userRole);
    if (!check) return res.sendStatus(401);
    next();
  };

module.exports = authorize;
