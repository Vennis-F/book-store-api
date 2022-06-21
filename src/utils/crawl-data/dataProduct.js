const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const Product = require("../../models/product");
const { generateRandom } = require("../method-utils");
const Category = require("../../models/category");

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
  "Báo Sinh Viên VN - Hoa Học Trò",
  "NXB Đại học Kinh Tế Quốc Dân",
  "National Geographic Kids",
  "NXB Hà Nội",
  "NXB Thế Giới",
  "NXB Hoa Hương",
];
const dataDesc = [
  "Siêu Nhí Hỏi Nhà Khoa Học Trả Lời<br/><br/>Cuốn sách khoa học đáng yêu cho các bạn nhỏ này tập hợp 100 câu hỏi về cuộc sống hàng ngày từ các bạn học sinh trên khắp thế giới gửi đến nhà khoa học Robert Winston. Cuốn sách cho chúng ta thấy sự tò mò chung của trẻ em đối với thế giới xung quanh qua những câu hỏi những thu thập từ trẻ em ở Vương quốc Anh, các nước Châu Âu khác, Canada, Mỹ, Ấn Độ, Trung Quốc và Nhật Bản. Các câu hỏi xoay quanh những khía cạnh khác nhau của khoa học, bao trùm ở các chủ đề chính gồm cơ thể con người, vật lý, hóa học, không gian, khoa học tự nhiên và Trái Đất.<br/><br/>100 câu hỏi là những quan sát thông minh và thú vị của các bạn nhỏ với sự tò mò và óc tưởng tượng phong phú của mình. Tất cả các câu hỏi đều được trả lời rõ ràng và sống động. <br/><br/>Cuốn sách 'Siêu nhí hỏi – nhà khoa học trả lời' chắc chắn sẽ đem đến một thế giới khoa học đầy niềm vui, hài hước, thú vị, làm thỏa mãn trí tò mò của các nhà khoa học nhí. Hơn thế nữa cuốn sách cũng sẽ giúp cả gia đình có những phút giây thoải mái và gắn kết khi cùng nhau khám phá thế giới khoa học diệu kỳ.",
  "Cuốn sách đã trở thành cuốn sách bán chạy nhất trên thế giới thời điểm đó, được dịch ra 33 thứ tiếng và nhận được nhiều giải thưởng, trong đó có một giải Pulitzer, một giải thưởng Sách Khoa học Aventis và giải thưởng Khoa học Phi Beta Kappa năm 1997. Một bộ phim tài liệu truyền hình nhiều tập dựa trên cuốn sách đã được Hiệp hội Địa lý Quốc gia sản xuất vào năm 2005<br/><br/>Nội dung cuốn sách giải thích vì sao các nền văn minh Á – Âu (bao gồm cả Bắc Phi) lại tồn tại được, cũng như đã chinh phục các nền văn minh khác, cùng lúc ông bác bỏ các lý thuyết về sự thống trị của các nền văn minh Á –Âu dựa trên trí tuệ, đạo đức hay ưu thế di truyền. Jared Diamond lập luận rằng, sự khác biệt về quyền lực và công nghệ giữa các xã hội loài người có nguồn gốc từ sự khác biệt về môi trường, trong đó sự khác biệt này được khuếch đại không ngừng. Qua đó, ông giải thích tại sao Tây Âu, chứ không phải các nền văn minh khác trong thế giới Á – Âu như Trung Quốc, lại trở thành các thế lực thống trị.<br/><br/>Mục đích của cuốn sách này là cung cấp một lược sử về tất cả mọi người trong khoảng 13.000 năm trở lại đây. Câu hỏi đã khiến tôi viết ra cuốn sách này là: tại sao lịch sử đã diễn ra trên mỗi châu lục một khác? Nếu như câu hỏi này lập tức khiến bạn nhún vai cho rằng bạn sắp phải đọc một luận văn phân biệt chủng tộc thì, xin thưa, không phải vậy. Như bạn sẽ thấy, những lời đáp cho câu hỏi này tuyệt không bao hàm những sự khác biệt về chủng tộc. Cuốn sách này tập trung truy tìm những lý giải tối hậu và đẩy lùi chuỗi nhân quả lịch sử càng xa bao nhiêu càng tốt bấy nhiêu.<br/><br/>",
  "Thinking fast and slow - Tư duy nhanh và chậm  - cuốn sách được Tạp chí Tài chính Mỹ đặc biệt đánh giá là một kiệt tác trong việc nói về tính hợp lý, phi lý của con người trong tư duy, trong việc đánh giá và ra quyết định.<br/><br/>Trong cuộc sống, dù bạn có cẩn trọng đến mức nào thì vẫn có những lúc bạn đưa ra những quyết định dựa trên cảm tình chủ quan của mình. Thinking fast and slow, cuốn sách nổi tiếng tổng hợp tất cả nghiên cứu được tiến hành qua nhiều thập kỷ của nhà tâm lý học từng đạt giải Nobel Kinh tế Daniel Kahneman sẽ cho bạn thấy những sư hợp lý và phi lý trong tư duy bản thân. Cuốn sách được đánh giá là 'kiệt tác' trong việc thay đổi hành vi của con người, Thinking fast and slow đã giành được vô số giải thưởng danh giá, lọt vào Top 11 cuốn sách kinh doanh hấp dẫn nhất năm 2011. Cuốn sách được Alpha Books mua bản quyền và xuất bản vào Quý I năm nay. Thinking fast and slow dù là cuốn sách có tính hàn lâm cao nhưng được truyền tải một cách vui nhộn và dễ hiểu, hứa hẹn sẽ mang lại cho bạn đọc nhiều kiến thức mới mẻ, bổ ích.<br/><br/>Thinking fast and slow sẽ đưa ra và lý giải hai hệ thống tư duy tác động đến con đường nhận thức của bạn. Kahneman gọi đó là: hệ thống 1 và hệ thống 2. Hệ thống 1, còn gọi là cơ chế nghĩ nhanh, tự động, thường xuyên được sử dụng, cảm tính, rập khuôn và tiềm thức. Hệ thống 2, còn gọi là cơ chế nghĩ chậm, đòi hỏi ít nỗ lực, ít được sử dụng, dùng logic có tính toán và ý thức. Trong một loạt thí nghiệm tâm lý mang tính tiên phong, Kahneman và Tversky chứng minh rằng, con người chúng ta thường đi đến quyết định theo cơ chế nghĩ nhanh hơn là ghĩ chậm. Phần lớn nội dung của cuốn sách chỉ ra những sai lầm của con người khi suy nghĩ theo hệ thống 1. Kahneman chứng minh rằng chúng ta tệ hơn những gì chúng ta tưởng: đó là chúng ta không biết những gì chúng ta không biết!",
  "Giờ đây, với cái nhìn sâu sắc hơn tác giả Stanton E.Samenow đã cung cấp cho độc giả một ấn bản cập nhật hoàn toàn về tác phẩm kinh điển của mình, bao gồm những sự nhận thức mới mẻ về tội ác đang được chú ý ngày nay, từ sự rình rập và bạo lực gia đình đến tội phạm cổ cồn và chính trị khủng bố. Ông đã từng có ba thập kỷ làm việc với tội phạm khẳng định lại lập luận của mình rằng các yếu tố như nghèo đói, ly hôn và bạo lực trên phương tiện truyền thông không gây ra tội phạm. Đúng hơn, như các tài liệu của Samenow ở đây, tất cả tội phạm đều có chung một suy nghĩ đặc biệt - thường thấy rõ trong thời thơ ấu - khác hẳn với suy nghĩ của một công dân có trách nhiệm.<br /><br/>Trong khi các loại tội phạm mới ngày càng phổ biến hơn, hoặc ít nhất là dễ nhìn thấy hơn với công chúng - từ lạm dụng vợ chồng đến các vụ xả súng ở trường học - có rất ít thay đổi về cách tiếp cận của chúng ta đối với tội phạm. Các chương trình phục hồi dựa trên giả định rằng xã hội đổ lỗi cho tội phạm nhiều hơn là tội phạm, một giả định mà mối liên hệ nhân quả vẫn chưa được thiết lập, đã được chứng minh là không đầy đủ. Tội phạm tiếp tục xâm chiếm mọi khía cạnh của cuộc sống chúng ta, các tòa án hình sự và nhà tù luôn quá tải, và tỷ lệ tái phạm tiếp tục leo thang.",
  "Tại hiện trường án mạng do chú linh gây ra, Itadori đã gặp gỡ Junpei, cả hai tâm đầu ý hợp. Nhưng Junpei lại tôn sùng chú linh Mahito, thủ phạm của vụ án. Mahito lợi dụng Junpei, hòng li gián cậu và Itadori. Junpei rơi vào cạm bẫy của hắn và...",
  "'Một con dế đã từ tay ông thả ra chu du thế giới tìm những điều tốt đẹp cho loài người. Và con dế ấy đã mang tên tuổi ông đi cùng trên những chặng đường phiêu lưu đến với cộng đồng những con vật trong văn học thế giới, đến với những xứ sở thiên nhiên và văn hóa của các quốc gia khác. Dế Mèn Tô Hoài đã lại sinh ra Tô Hoài Dế Mèn, một nhà văn trẻ mãi không già trong văn chương...' - Nhà phê bình Phạm Xuân Nguyên<br/><br/>“Ông rất hiểu tư duy trẻ thơ, kể với chúng theo cách nghĩ của chúng, lí giải sự vật theo lô gích của trẻ. Hơn thế, với biệt tài miêu tả loài vật, Tô Hoài dựng lên một thế giới gần gũi với trẻ thơ. Khi cần, ông biết đem vào chất du ký khiến cho độc giả nhỏ tuổi vừa hồi hộp theo dõi, vừa thích thú khám phá.” - TS Nguyễn Đăng Điệp",
  "Một cuộc tình tốt đẹp thì nhất định phải có sự thỏa hiệp lẫn nhau. Con người không phải các mảnh ghép, không phải sinh ra đã khuyết mất một mảnh và đợi chờ mảnh còn lại đến để bổ lấp. Con người ấy mà, đều có tính cách và những yêu thích riêng, nhưng bằng lòng vì nhau mà liên tục mài cho bản thân tròn vành, thì lúc ôm chầm mới có thể sưởi ấm và không làm đau đớn lẫn nhau.<br/><br/>Cuốn sách Mạnh dạn buông bỏ khi tình không tỏ là cuốn sách viết về những cảm xúc trong tình yêu của những người trẻ. Ta như thấy mình qua những cảm xúc chông chênh, lên bổng xuống trầm của thời thanh xuân. Người ta cứ sợ đau nhưng không hề biết rằng, nỗi đau dai dẳng bấy lâu nay họ chịu đựng còn lớn hơn thế gấp nhiều lần. Hãy mạnh dạn buông bỏ, đừng cứ mãi cố chấp níu giữ những gì không xứng đáng.",
  "Hầu hết mọi người đều cảm thấy cuộc sống là một cuộc chiến bởi họ không biết rằng cuộc sống có thể trở nên dễ dàng hơn, thoải mái và bình yên hơn bằng cách tối giản từ trong chính suy nghĩ và hành động. Nếu một người cứ mãi đấu tranh với các vấn đề tài chính, sự nghiệp, sức khỏe, các mối quan hệ... thì cuộc sống của người đó sẽ luôn mang màu sắc u tối, ảm đạm.<br/><br/>Thế hệ sở hữu nhiều gam màu buồn nhất của cuộc sống hiện nay có lẽ là những người trẻ thiếu kinh nghiệm sống. Bạn có đang trong độ tuổi loay hoay với những kế hoạch và có cảm thấy cô đơn, bối rối không khi phải tập quen với việc một mình đấu tranh với những khó khăn của cuộc sống? Bạn đang lo lắng khi không biết sẽ phải vượt qua như thế nào, ai sẽ giúp bạn có những định hướng tốt hơn?",
  "Truyện lấy bối cảnh vào thời chúa Nguyễn, dưới thời chúa Nguyễn Phúc Khoát, nhưng những sự kiện xảy ra trong truyện không trùng lặp với những sự kiện xảy ra trên thực tế. Tác phẩm này ban đầu kể lại về cuộc đời của Trạng Quỳnh - một người có tính cách trào phúng dân gian Việt Nam. Trong truyện này, Trạng Quỳnh vốn thông minh từ trong bụng mẹ.<br/><br/>Trước khi cậu sinh ra, một lần bà mẹ ra ao giặt đồ, bỗng nhìn thấy một chú vịt, bà mẹ liền ngâm câu thơ, và lập tức có tiếng đối đáp lại trong bụng vịt.<br/><br/>Bà cho rằng đó là điềm lạ, nghĩ rằng bà sẽ sinh ra một quý tử, hiểu biết hơn người, sẽ là người có tiếng tăm. Thời gian trôi qua, bà hạ sinh một bé trai, tư dung thông minh lạ thường, đặt tên là Quỳnh.",
  "Nhìn. Hỏi. Rồi, Nhảy Đi! là cuốn sách ra đời trong nỗ lực tìm kiếm một công cụ để giúp đỡ các bạn tìm thấy chính mình sớm hơn. Anbooks mong rằng cùng với sự ý thức rõ rệt về bản thân, bao gồm sở thích, đam mê, cá tính và cả điểm yếu… ngay từ khi còn ngồi ở ghế nhà trường, các bạn trẻ sẽ giảm thiểu những quyết định sai khi chọn nghành nghề mà mình sẽ theo đuổi trong suốt những năm đại học và sau đó, cả cuộc đời mình.<br /><br />Rất nhiều bạn sinh viên chia sẻ rằng, em bị ba mẹ bắt buộc phải học ngành Y, trong khi em rất thích Nông Nghiệp; hoặc em đam mê ngành quản trị kinh doanh nhưng lại đang phải học Công Nghệ; hoặc em muốn trở thành một người khởi nghiệp nhưng lại không biết bắt đầu từ đâu?…<br /><br />Cuốn sách có thể sẽ gây thú vị cho các bạn độc giả trẻ, những người đang trên đường đi tìm chính mình. Với lối viết như đang nói chuyện, tâm tình, dường như Thi Anh Đào đã 'làm tròn vai' người chị, người bạn đồng hành, người hướng dẫn của các bạn. Có lúc Đào hỏi thẳng vào vấn đề của các bạn, có lúc Đào lại hồi tưởng, soi chiếu vào chính mình. Đào vừa mới đi qua chỗ mà các bạn đang tới.",
];

const createDataCrawl = () => {
  request(
    "https://www.fahasa.com/all-category.html?order=num_orders&limit=24&p=1",
    async (error, response, html) => {
      console.log(response.statusCode);
      const categoryList = await Category.find({});

      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        let data = [];
        $(".item-inner").each((index, el) => {
          const title = $(el).find(".p-name-list").text();
          let listPrice = 0;
          let salePrice = $(el).find(".special-price").text();
          const quantity = generateRandom(1, 1000);
          const description = dataDesc[generateRandom(0, dataDesc.length - 1)];
          const feartured = false;
          const status = true;
          const author = "Nguyễn Hoàng Anh";
          const publisher =
            dataPubliser[generateRandom(0, dataPubliser.length - 1)];
          const pages = 200;
          const publicDate = "2020/10/10";
          const thumbnail = $(el).find(".product-image img").attr("data-src");

          //Categories
          const category =
            categoryList[generateRandom(0, categoryList.length - 1)]._id;

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
            briefInformation: {
              author,
              publisher,
              pages,
              publicDate,
            },
            thumbnail,
            category,
          }); // đẩy dữ liệu vào biến data
        });

        fs.writeFileSync("data.json", JSON.stringify(data)); // lưu dữ liệu vào file data.json
      } else {
        console.log(error);
      }
    }
  );
};
const saveDataCrawl = () => {
  const data = JSON.parse(fs.readFileSync("data.json").toString());

  const dataProductModel = data.map((product) => new Product(product));
  dataProductModel.forEach((data) => {
    console.log(data);
    data.save({ validateModifiedOnly: true });
  });
};

module.exports = { createDataCrawl, saveDataCrawl };
