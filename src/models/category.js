const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const mongoose_delete = require("mongoose-delete");

//Schema
const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, 
    trim: true,
  },
});

categorySchema.plugin(uniqueValidator);

//Model
const Category = mongoose.model("category", categorySchema);
module.exports = Category;

//Test
// let cates = [
//   { name: "Văn học" },
//   { name: "Manga" },
//   { name: "Tiểu thuyết" },
//   { name: "Tạp chí" },
//   { name: "Khoa học" },
// ]
// cates = cates.map((cate) => new Category(cate))
// cates.forEach((cate) => cate.save())
