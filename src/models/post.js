const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

// SubSchema
const imageSchema = mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  altImg: {
    type: String,
  },
})

// Schema
const postSchema = mongoose.Schema(
  {
    //Unique
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    //Require-normal
    brief: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: { type: String, required: true, trim: true },
    featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },

    //normal
    thumbnail: imageSchema,
    images: [imageSchema],

    //Ref:
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, //=> userId
  },
  {
    timestamps: true,
  }
)

postSchema.plugin(uniqueValidator)

//Model
const Post = mongoose.model("Post", postSchema)
module.exports = Post

// Test
// const post = new Post({
//   category: "Review có tâm nhất quả đất",
//   description: "Éo biết",
//   brief: "hihi",
//   title: "hihiihih",
//   author: "123456789012345678901234",
// })

// console.log(post)
// post.validate((err, data) => {
//   if (err) return console.log(err)
//   console.log("good")
// })
