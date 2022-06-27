const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const Product = require("../../models/product");
const { generateRandom } = require("../method-utils");
const Category = require("../../models/category");

const dataCategories = [
  "Sách tham khảo",
  "Sách học ngoại ngữ",
  "Văn học",
  "Thiếu nhi",
  "Tâm lý kỹ năng",
  "Kinh tế",
  "Sách giáo khoa",
  "Foreigns Books",
  "Văn phòng phẩm",
  "Đồ chơi",
];

const saveCateCrawl = () => {
  const listModel = dataCategories.map((name) => new Category({ name }));
  listModel.forEach((item) => {
    item.save({ validateModifiedOnly: true });
  });
};

module.exports = { saveCateCrawl };
