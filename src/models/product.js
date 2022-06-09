const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const productSchema = mongoose.Schema({
  //Unique
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  //Require-normal
  listPrice: {
    type: Number,
    required: true,

    min: 0,
  },
  salePrice: {
    type: Number,
    required: true,

    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  fearture: {
    type: Boolean,
    require: true,
    default: false,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
  briefInformation: {
    //require
    author: {
      type: String,
      required: true,
      trim: true,
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    publicDate: {
      type: Date,
      required: true,
      max: new Date(),
    },

    //normal
    language: {
      type: String,
      default: "Tiếng Việt",
      trim: true,
    },
    pages: {
      type: Number,

      validate(pages) {
        if (!validator.isInt(String(pages)))
          throw new Error(`${pages} is not an integer value`)
        if (pages <= 0) throw new Error("Pages must be positive number")
      },
    },
  },
  // thumbnail: {
  //   type: Buffer,
  //   required: true,
  // },

  //normal
  // images: [
  //   {
  //     image: {
  //       type: Buffer,
  //       required: true,
  //     },
  //     imageAltDoc: String,
  //   },
  // ],

  // //ref
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Category",
  }, //=> categoryId
})
productSchema.plugin(uniqueValidator)

//middleware
productSchema.pre("validate", function (next) {
  if (this.salePrice >= this.listPrice) {
    this.invalidate(
      "salePrice",
      "Sale price is over list price",
      this.salePrice
    )
  }

  next()
})

//Model
const Product = mongoose.model("Product", productSchema)
module.exports = Product

//Test
const product = new Product({
  title: "Naruto tập 4",
  listPrice: 10000,
  salePrice: 8000,
  description: "Đây là truyện tranh về Naruto shippuden",
  briefInformation: {
    author: "Honag Anh",
    publisher: "NXB Giao Duc tre em",
    pages: 100,
    publicDate: "2022/06/08",
  },
  category: "123456789012345678901234",
})
// console.log(product)
// product.validate((err) => {
//   if (err) return console.log(err.message)
//   console.log("GOOD")
// })
