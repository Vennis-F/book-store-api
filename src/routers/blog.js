const router = require("express").Router();
const Post = require("../models/post");
const User = require("../models/user");

//customer & guest route to check Blogs
//GET /blogs
//pagination  ?limit=...&page=...
//sortedBy=updatedAt_desc
router.get("/", async (req, res) => {
  console.log(req.query);
  try {
    const { limit, page, featured, status, sortedBy } = req.query;
    const options = { sort: { updatedAt: -1 } };
    const match = { status: true };
    const sort = {};

    //Filter
    if (featured) match.featured = featured === "true";
    if (status) match.status = status === "true";

    //sort
    if (sortedBy) {
      const parts = sortedBy.split("_"); // param: sortedBy=phone_desc
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
      options.sort = sort;
    }

    //Pagination
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const posts = await Post.find(match, null, options);
    for (const post of posts) {
      const author = await User.findById(post.author);
      post.author = author.fullName;
    }

    console.log(match, null, options);
    const count = await Post.count(match);
    res.send({ posts, count });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//GET /blogs/:id
router.get("/:id", async (req, res) => {
  try {
    //Find and Check blog exist:
    const blog = await Post.findById(req.params.id);
    const author = await User.findById(blog.author);
    blog.author = author.fullName;
    if (!blog) return res.sendStatus(404);

    res.send(blog);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

module.exports = router;
