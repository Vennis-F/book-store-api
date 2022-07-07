const router = require("express").Router();
const Post = require("../models/post");

//customer & guest rout to check Blogs
//GET /blogs
  //pagination  ?limit=...&page=...
router.get("/", async (req, res) => {
  try {
    const {limit, page} = req.query
    const options={sort:{createdAt:-1}}
    
    //Pagination
    if(limit) options.limit=parseInt(limit)
    if(page) options.skip= parseInt(limit) * (parseInt(page) - 1);

    const posts = await Post.find({},null,options);
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
