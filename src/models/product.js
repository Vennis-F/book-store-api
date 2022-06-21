const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Subschemas
const briefInformationSchema = mongoose.Schema({
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
    required: true,
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
})

const imageSchema = mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  altImg: {
    type: String,
  },
})

//////////////////////////////////////////////////////////
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
    default: 0,
    required: true,

    validate(value) {
      if (!validator.isInt(value.toString())) {
        throw new Error("Quantity should be an integer")
      }
    },
    //không xét min vì có thể âm
    //số âm thể hiện người mua mua quá sản phẩm trong kho
    // sản phẩm vẫn có thể  được nhập thêm vào kho // Sale sẽ quản lý
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  feartured: {
    //flag nổi bật, bật/tắt
    type: Boolean,
    default: false,
    required: true,
  },
  status: {
    //able, disable
    type: Boolean,
    default: true,
    required: true,
  },
  briefInformation: {
    //thông tin chung, tác giả, nhà xuất bản, ...
    type: briefInformationSchema,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },

  // normal
  images: {
    type: [imageSchema],
  },

  //ref
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Category",
  }, //=> categoryId
})

productSchema.plugin(uniqueValidator)

//middleware
productSchema.pre("validate", function (next) {
  if (this.salePrice > this.listPrice) {
    this.invalidate(
      "salePrice",
      "Sale price is over list price",
      this.salePrice
    )
  }

  next()
})

//Model
const Product = mongoose.model("product", productSchema)
module.exports = Product

// //Test
// const product = new Product({
//   title: "Naruto tập 4",
//   listPrice: 10000,
//   salePrice: 8000,
//   description: "Đây là truyện tranh về Naruto shippuden",
//   briefInformation: {
//     author: "Honag Anh",
//     publisher: "NXB Giao Duc tre em",
//     pages: 100,
//     publicDate: "2022/06/08",
//   },
//   thumbnail:"NARUTO",
//   category: "123456789012345678901234",
// })

const data1 = new Product({
  title: "Sách học ngoại ngữ Sách học ngoại ngữ ",
  listPrice: 60000,
  salePrice: 20000,
  quantity: 10,
  description: "Ok helo ae",
  feartured: true,
  status: true,
  briefInformation: {
    author: "Honag Anh",
    publisher: "NXB Giao Duc tre em",
    pages: 100,
    publicDate: "2022/06/08",
  },
  thumbnail:
    "https://cdn0.fahasa.com/media/catalog/product/z/3/z3097453775918_7ea22457f168a4de92d0ba8178a2257b.jpg",

  category: "123456789012345678901234",
})
const data2 = new Product({
  title: "Naruto tập 1",
  listPrice: 1260000,
  salePrice: 23000,
  quantity: 1013,
  description: "Ok helo ae",
  feartured: true,
  status: true,
  briefInformation: {
    author: "Honag Anh dsf",
    publisher: "NXB Giao Duc tre em dsfa",
    pages: 100,
    publicDate: "2022/06/08",
  },
  thumbnail:
    "https://cdn0.fahasa.com/media/catalog/product/d/r/dragon-ball-full-color---phan-bon---frieza-dai-de-_-tap-2_1.jpg",

  category: "123456789012345678901234",
})

const test = async () => {
  try {
    await data2.save()
  } catch (error) {
    console.log(error)
  }
}

// test()
