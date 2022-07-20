const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Category = require("../models/category");
const Post = require("../models/post");
const Role = require("../models/role");
const User = require("../models/user");
const { isValidUpdate } = require("../utils/valid");

//POST /posts
//this will auto update the author name
router.post("/", auth, authorize("marketing"), async (req, res) => {
  const post = new Post(req.body);
  // console.log(req.body);
  try {
    post.author = req.user._id;
    await post.save();
    res.sendStatus(201);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

//GET /posts
//Post lists
//filter : category, author, status
//category=...&author=...&status=...
//sortable: title, category, author, featured, status
//sortedBy=title_desc //sortedBy=status_asc
router.get("/", async (req, res) => {
  try {
    const { category, author, status, sortedBy, limit, page } = req.query;
    const match = {};
    const sort = { createdAt: -1 };
    const options = { sort };

    //filter

    if (status) {
      match.status = status === "true";
    }

    //sort
    if (sortedBy) {
      const parts = sortedBy.split("_"); // param: sortedBy=auhor_desc
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
      options.sort = sort;
    }

    //Paging
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    // if no populate (author)
    const posts = await Post.find(match, null, options);

    const count = await Post.countDocuments();
    for (const post of posts) {
      const author = await User.findById(post.author);
      post.author = author.fullName;
    }

    await Promise.all(
      posts.map((post) => {
        return post.populate({ path: "category", model: Category });
      })
    );

    res.send({ posts, count });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

//GET /posts/search?search=...
//search by title
//pagination          ?limit=...&page=...

router.post("/search", auth, authorize("marketing"), async (req, res) => {
  try {
    let { limit, page, search } = req.body;
    const options = {};
    let title = new RegExp(search, "gi");

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

    const post = await Post.find({ title }, null, options);

    res.send(post);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//GET /posts/:id
router.get("/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    //Find and Check post exist:
    const post = await Post.findById(req.params.id);
    if (!post) return res.sendStatus(404);

    res.send(post);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /posts/:id
router.put("/", async (req, res) => {
  console.log(req.body);
  const updates = Object.keys(req.body);
  const allowUpdateds = [
    "title",
    "brief",
    "description",
    "category",
    "featured",
    "status",
    "thumbnail",
    "author",
    "id",
    "category",
  ];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    const post = await Post.findById(req.body.id);

    if (!post) return res.sendStatus(404);

    updates.forEach((update) => {
      post[update] = req.body[update];
    });
    await post.save();

    res.send(post);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//DELETE /posts/:id
router.delete("/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).send();

    res.send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
