const router = require("express").Router();
const Post = require("../models/post");

//customer & guest rout to check Blogs
//GET /blogs
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({});
    res.send(posts);
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
