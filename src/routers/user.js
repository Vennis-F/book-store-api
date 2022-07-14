const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { resetPassword } = require("../emails/account");
const Role = require("../models/role");
const { isValidUpdate } = require("../utils/valid");
const router = require("express").Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

///////////////////////////////////GUEST
//POST /user/guest
router.post("/guest", async (req, res) => {
  const role = await Role.findOne({
    name: "guest",
  });
  const userId = new ObjectId();
  req.session.guest = {
    _id: userId,
    role,
  };
  req.session.cartGuest = {
    _id: new ObjectId(),
    totalCost: 0,
    items: [],
    user: userId,
  };

  try {
    res.status(201).send({
      guest: req.session.guest,
      cartGuest: req.session.cartGuest,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      error: error.message,
    });
  }
});

//POST /user/register
router.post("/register", async (req, res) => {
  const role = await Role.findOne({
    name: "customer",
  });
  const user = new User({
    ...req.body,
    role: role._id,
  });

  try {
    // //Delete session
    // req.session.destroy();

    //Create user
    const token = await user.generateAuthToken();
    res.status(201).send({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      error: error.message,
    });
  }
});

//POST /user/login
router.post("/login", async (req, res) => {
  try {
    // //Delete session
    // req.session.destroy();

    //Login
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({
      user,
      token,
    });
  } catch (error) {
    // console.log(error);
    console.log(error.message);
    res.status(400).send({
      error: error.message,
    });
  }
});

//POST /user/logout
router.post("/logout", auth, async (req, res) => {
  try {
    //Delete token
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save({
      validateModifiedOnly: true,
    });

    //Delete session
    req.session.destroy();
    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//POST /logoutAll
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save({
      validateModifiedOnly: true,
    });

    //Delete session
    req.session.destroy();
    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//GET /user/profile
//"customer", "marketing", "sale", "saleManager", "admin"
router.get("/profile", auth, authorize("customer"), async (req, res) => {
  res.send({
    user: req.user,
    role: req.role,
  });
});

//GET /user (get all users)
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

//PATCH  /user/profile (only update "fullName", "gender", "phone", "address" !!!not have avatar)
router.patch("/profile", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["fullName", "gender", "phone", "address"];

  //Check valid update
  const isValid = updates.every((update) => allowUpdateds.includes(update));
  if (!isValid)
    return res.status(400).send({
      error: "Invalid updates",
    });

  try {
    //Update user
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save({
      validateModifiedOnly: true,
    });

    console.log(req.user);
    res.send(req.user);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      error: error.message,
    });
  }
});

//PATCH  /user/password (check empty bằng frontend)
router.patch("/new-password", auth, async (req, res) => {
  try {
    const { currPassword, newPassword, confirm } = req.body;

    //Check current password
    const checkPwd = await bcrypt.compare(currPassword, req.user.password);
    if (!checkPwd)
      return res.status(400).send({
        error: "Mật khẩu cũ không đúng",
      });

    //Check newPassword === confirm
    if (newPassword !== confirm)
      return res.status(400).send({
        error: "Mật khẩu mới không giống mật khẩu cũ",
      });

    //Compare password to old password
    const isMatch = await bcrypt.compare(newPassword, req.user.password);
    if (isMatch)
      return res.status(400).send({
        error: "Mật khẩu mới giống với mật khẩu cũ",
      });

    //Change new password
    req.user.password = newPassword;
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      error: error.message,
    });
    res.status(500).send({
      error,
    });
  }
});

//PATCH /user/role/:id (userId)
router.patch("/role/:id", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["role"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({
      error: "Invalid updates",
    });

  try {
    //Check idUser exist
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).send({
        error: "Cannot find user",
      });

    //Check idRole exist
    if (!(await Role.findById(req.body.role)))
      return res.status(404).send({
        error: "Cannot find roleId",
      });

    //Find and Update role
    user.role = req.body.role;

    await user.save();
    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({
        error: "Invalid ID",
      });
    res.status(400).send(e.message);
  }
});

//PATCH /user/user/:id (userId)
router.patch("/status/:id", auth, authorize("customer"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["status"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({
      error: "Invalid updates",
    });

  try {
    //Find and Update user status
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    //Find and Check cate exist:
    if (!user) return res.sendStatus(404);
    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({
        error: "Invalid ID",
      });
    res.status(400).send(e.message);
  }
});

//POST / user / forgotten
router.post("/forgotten", auth, async (req, res) => {
  resetPassword(req.body.email);
  res.send();
});

////////////////////////////////Admin Role
router.get("/admin/roles", auth, authorize("admin"), async (req, res) => {
  try {
    const roles = await Role.find({});
    res.send(roles);
  } catch (error) {
    res.status(500).send();
  }
});

//POST /user/admin
router.post("/admin", auth, authorize("admin"), async (req, res) => {
  const user = new User(req.body);
  console.log(user);
  try {
    await user.save();
    res.sendStatus(201);
  } catch (e) {
    console.log(e);
    console.log(e.message);
    res.status(500).send(e);
  }
});

//GET /user/admin
//Users lists
//filter : gender, role, status
//gender = [M/F/D]
//sortable: id, fullName, gender, email, phone, role, status
//sortedBy=id_desc //sortedBy=status_asc  ...
//Pagination: limit, page
router.get("/admin", auth, authorize("admin"), async (req, res) => {
  try {
    const { gender, role, status, sortedBy, limit, page } = req.query;
    const match = {};
    const sort = {
      _id: -1,
    };
    const options = {
      sort,
    };

    //filter

    if (status) {
      match.status = status === "true";
    }

    if (gender) {
      match.gender = gender;
    }

    //sort
    if (sortedBy) {
      const parts = sortedBy.split("_");

      if (parts[0] === "id") {
        sort["_id"] = parts[1] === "desc" ? -1 : 1;
        options.sort = sort;
      } else {
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
        delete sort._id;
        options.sort = sort;
      }
    }

    //Paging
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const users = await User.find(match, null, options).populate({
      path: "role",
      select: "name",
    });

    function compareAsc(a, b) {
      if (a.role.name < b.role.name) {
        return -1;
      }
      if (a.role.name > b.role.name) {
        return 1;
      }
      return 0;
    }

    function compareDesc(a, b) {
      if (a.role.name < b.role.name) {
        return 1;
      }
      if (a.role.name > b.role.name) {
        return -1;
      }
      return 0;
    }

    //sort role
    if (sort.role) {
      if (sort.role === 1) users.sort(compareAsc);
      else users.sort(compareDesc);
    }

    //role filter
    if (role) {
      const sendUsers = users.filter((user) => {
        if (user.role.name.match(new RegExp(role))) return user;
      });
      return res.send({
        users: sendUsers,
        count: sendUsers.length,
      });
    }

    res.send({
      users,
      count: users.length,
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//GET /user/admin/search?search=...
//search by fullName, email, phone
//pagination          ?limit=...&page=...
router.post("/admin/search", auth, authorize("admin"), async (req, res) => {
  try {
    let { limit, page, search } = req.body;
    const options = {};

    //Paging
    if (limit) options.limit = parseInt(limit);
    else {
      limit = 5;
    }
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);
    else {
      page = 1;
      options.skip = parseInt(limit) * (parseInt(page) - 1);
    }

    //search
    const searchResult = [];
    const checkById = [];

    let name = new RegExp(search, "gi");
    const users = await User.find(
      {
        fullName: name,
      },
      null,
      options
    );
    for (const user of users) {
      if (checkById.length >= limit) break;
      if (!checkById.includes(user._id.toString())) {
        checkById.push(user._id.toString());
        searchResult.push(user);
      }
    }

    if (checkById < limit - 1) {
      let mail = new RegExp(search, "gi");
      const users = await User.find(
        {
          email: mail,
        },
        null,
        options
      );
      for (const user of users) {
        if (checkById.length >= limit) break;
        if (!checkById.includes(user._id.toString())) {
          checkById.push(user._id.toString());
          searchResult.push(user);
        }
      }
    }

    if (checkById < limit - 1) {
      let mobile = new RegExp(search, "gi");
      const users = await User.find(
        {
          phone: mobile,
        },
        null,
        options
      );
      for (let user of users) {
        if (checkById.length >= limit) break;
        if (!checkById.includes(user._id.toString())) {
          checkById.push(user._id.toString());
          searchResult.push(user);
        }
      }
    }

    res.send(searchResult);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//GET /user/admin/getOne?userID=...
router.get("/admin/getOne", auth, authorize("admin"), async (req, res) => {
  try {
    //Find and Check post exist:
    const user = await User.findById(req.query.userId);
    if (!user) return res.sendStatus(404);

    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({
        error: "Invalid ID",
      });
    res.status(500).send(e);
  }
});

//PUT /user/admin/:id
router.put("/admin/", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = [
    "status",
    "role",
    "id",
    "address",
    "email",
    "fullName",
    "phone",
  ];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({
      error: "Invalid updates",
    });

  try {
    const user = await User.findById(req.body?.id);

    if (!user) return res.sendStatus(404);

    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();

    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({
        error: "Invalid ID",
      });
    res.status(400).send(e.message);
  }
});

// //DELETE /posts/:id
// router.delete('/:id', auth, authorize('marketing'), async (req, res) => {
//   try {
//     const post = await Post.findByIdAndDelete(req.params.id)
//     if (!post)
//       return res.status(404).send()

//     res.send(post)
//   } catch (error) {
//     res.status(500).send(error)
//   }
// })

module.exports = router;
