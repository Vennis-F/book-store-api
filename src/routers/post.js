const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Post = require("../models/post");
const Role = require("../models/role");
const User = require("../models/user");
const { isValidUpdate } = require("../utils/valid");

//POST /posts
//this will auto update the author name
router.post("/", auth, authorize("marketing"), async (req, res) => {
  const post = new Post(req.body);
  post.author= req.user._id
  try {
    await post.save();
    res.sendStatus(201);
  } catch (e) {
    res.status(400).send(e);
  }
});

//GET /posts  
              //Post lists  
//filter : category, author, status
              //category=...&author=...&status=...
//sortable: title, category, author, featured, status
              //sortedBy=title_desc //sortedBy=status_asc
//search by title
              //searchByTitle=...
router.get("/", auth, authorize("marketing"), async (req, res) => {
  try {
    const {category, author, status, sortedBy, limit, page, searchByTitle} = req.query
    const match= {}
    const sort= {createdAt:-1}
    const options= {sort}
    
    //filter
    if(category) {
      match.category= new RegExp(category.trim(),'gi')
    }

    if(status) {
      match.status= (status==="true")
    }

    //sort
    if(sortedBy) {
      const parts = sortedBy.split('_')       // param: sortedBy=auhor_desc 
      sort[parts[0]] = (parts[1] === 'desc' ? -1 : 1)
      options.sort=sort
    }

    //Paging
    if(limit) options.limit = parseInt(limit)
    if(page) options.skip= parseInt(limit) * (parseInt(page) - 1);

    //If search by title, then search and return
    if(searchByTitle) {
      console.log(searchByTitle)
      let title = new RegExp(searchByTitle,'gi')
      let posts = await Post.find({title},null,options)
      if(!posts) 
        return res.status(404).send()
      return res.send(posts)
    }

    // if no populate (author)
    if(!author) {
      const posts = await Post.find(match,null,options).populate({path:'author', select: 'fullName'});
      res.send(posts);
    }else {
      const marketingRoleId = await Role.findOne({name: 'marketing'})
      const authors = await User.find({
        fullName: new RegExp(author,'gi'),
        role: marketingRoleId}).populate({
          path:'posts',
          match,
          options})

      const authorsPosts=[]  
      for (const author of authors) {
        for (const post of author.posts) {
          await post.populate({path:'author', select: 'fullName'})
          authorsPosts.push(post)
          console.log(authorsPosts)}
      }
      res.send(authorsPosts)
    }
    
  } catch (e) {
    res.status(500).send(e);
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
  const allowUpdateds = ['title','brief','description',
                        'category','featured','status',
                        'thumbnail','author'];
                        
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });
 
  try {
    //Find and Update post
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { runValidators: true, new: true }
    );

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
