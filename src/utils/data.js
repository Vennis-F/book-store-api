const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");

const generateRandom = (min, max) => {
  // find diff
  let difference = max - min;

  // generate random number
  let rand = Math.random();

  // multiply with difference
  rand = Math.floor(rand * difference);

  // add with min value
  rand = rand + min;

  return rand;
};
const dataPubliser = [
  "NXB Kim Đồng",
  "NXB Trẻ",
  "NXB Tổng hợp thành phố Hồ Chí Minh",
  "NXB chính trị quốc gia sự thật",
  "NXB giáo dục",
  "NXB Hội Nhà văn",
  "NXB Tư pháp",
  "NXB Thông tin và Truyền thông",
  "NXB lao động",
  "NXB giao thông vận tải",
  "NXB Đại học Quốc Gia Hà Nội",
  "NXB Dân Trí",
  "NXB Đại Học Sư Phạm TPHCM",
  "NXB Văn Học",
  "NXB Dân Trí",
  "NXB Dân Trí",
  "NXB Dân Trí",
];

request(
  "https://www.fahasa.com/all-category.html?order=num_orders&limit=24&p=1",
  (error, response, html) => {
    console.log(response.statusCode);

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      let data = [];
      $(".item-inner").each((index, el) => {
        const title = $(el).find(".p-name-list").text();
        let listPrice = 0;
        let salePrice = $(el).find(".special-price").text();
        const quantity = generateRandom(1, 1000);
        const description =
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Error explicabo sint totam provident voluptatem impedit numquam, architecto quaerat at expedita iusto ipsa autem quas asperiores quibusdam omnis odit ea dolorum.";
        const feartured = false;
        const status = true;
        const author = "Nguyễn Hoàng Anh";
        const publisher =
          dataPubliser[generateRandom(0, dataPubliser.length - 1)];
        const pages = 200;
        const publicDate = "2020/10/10";
        const thumbail = $(el).find(".product-image img").attr("data-src");
        const category = "123456789012345678901234";

        //Adjust
        salePrice = Number(
          salePrice
            .replace(/\t/g, "")
            .replace(/\n/g, "")
            .replace(/ /g, "")
            // .replace(/./g, "");
            .replace(/đ/g, "")
            .replace(/ /g, "")
            .replaceAll(".", "")
        );
        listPrice = Math.floor(salePrice / 0.9);

        data.push({
          title,
          listPrice,
          salePrice,
          quantity,
          description,
          feartured,
          status,
          briefInormation: {
            author,
            publisher,
            pages,
            publicDate,
          },
          thumbail,
          category,
        }); // đẩy dữ liệu vào biến data
      });

      fs.writeFileSync("data.json", JSON.stringify(data)); // lưu dữ liệu vào file data.json
    } else {
      console.log(error);
    }
  }
);
