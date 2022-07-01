const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Post = require("../models/post");
const { isValidUpdate } = require("../utils/valid");

//POST /posts
//this will auto update the author name
router.post("/", auth, authorize("marketing"), async (req, res) => {
  const post = new Post(req.body);
  post.author = req.user._id;
  try {
    await post.save();
    res.sendStatus(201);
  } catch (e) {
    res.status(400).send(e);
  }
});

//GET /posts
router.get("/", auth, authorize("marketing"), async (req, res) => {
  try {
    const posts = await Post.find({});
    res.send(posts);
  } catch (e) {
    res.status(500).send();
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
router.patch("/:id", auth, authorize("marketing"), async (req, res) => {
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
  ];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Update post
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });

    //Find and Check cate exist:
    if (!post) return res.sendStatus(404);

    res.send(post);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//DELETE /posts

module.exports = router;
