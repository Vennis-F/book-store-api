const router = require("express").Router();
const Post = require("../models/post");
const User = require("../models/user");

//customer & guest rout to check Blogs
//GET /blogs
//pagination  ?limit=...&page=...
router.get("/", async (req, res) => {
  try {
    const { limit, page, featured } = req.query;
    const options = { sort: { createdAt: -1 } };
    const match = { status: true };

    //Filter
    if (featured) match.featured = featured === "true";

    //Pagination
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const posts = await Post.find(match, null, options).populate({
      path: "author",
    });
    for (const post of posts) {
      const author = await User.findById(post.author);
      post.author = author.fullName;
    }

    const count = await Post.count(match);
    res.send({ posts, count });
  } catch (e) {
    res.status(500).send();
  }
});

//GET /blogs/:id
router.get("/:id", async (req, res) => {
  try {
    //Find and Check blog exist:
    const blog = await Post.findById(req.params.id);
    if (!blog) return res.sendStatus(404);

    res.send(blog);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

module.exports = router;
