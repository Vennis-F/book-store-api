const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

const productSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  listPrice: {
    type: Number,
    required: true,

    min: 0,
  },
  salePrice: {
    type: Number,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  briefInformation: {
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
      max: new Date(),
    },
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
  description: {
    type: String,
    required: true,
    trim: true,
  },
  fearture: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  thumbnail: {
    type: Buffer,
    required: true,
  },
  images: [
    {
      image: {
        type: Buffer,
        required: true,
      },
      imageAltDoc: String,
    },
  ],

  // Ref
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Category",
  }, //=> categoryId
})
productSchema.plugin(uniqueValidator)

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

// briefInformation: {
//   author: "Honag Anh",
//   publisher: "NXB Giao Duc tre em",
//   pages: 100,
//   publicDate: "2022/06/08",
// },
