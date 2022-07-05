const express = require("express");
const session = require("express-session");
const cors = require("cors");
const frameguard = require("frameguard");
const MongoStore = require("connect-mongo");
const userRouter = require("./routers/user");
const categoriesRouter = require("./routers/categories");
const productsRouter = require("./routers/products");
const cartRouter = require("./routers/cart");
const rolesRouter = require("./routers/role");
const checkoutRouter = require("./routers/checkout");
const ordersRouter = require("./routers/orders");
const sessionRouter = require("./routers/session");
const postRouter = require("./routers/post");
const blogRouter = require("./routers/blog");
const feedbackRouter = require("./routers/feedback");
const sliderRouter = require("./routers/slider");
const app = express();
const port = process.env.PORT || 6969;

//Config
app.use(frameguard({ action: "SAMEORIGIN" }));
require("./db/mongoose");
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

//Session
app.use(
  session({
    secret: "Asu",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 18000000000,
      secure: false,
    },
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/book-store", //YOUR MONGODB URL
      // ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),
  })
);

//Config express
app.use("/user", userRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/roles", rolesRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/orders", ordersRouter);
app.use("/session", sessionRouter);
app.use("/posts", postRouter);
app.use("/blogs", blogRouter);
app.use("/feedbacks", feedbackRouter);
app.use("/sliders", sliderRouter);

require("./models/slider");

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { saveCateCrawl } = require("./utils/crawl-data/dataCategory");
const {
  createDataCrawl,
  saveDataCrawl,
} = require("./utils/crawl-data/dataProduct");
const Product = require("./models/product");

// Product.findOneAndUpdate(
//   { _id: "62b1e79c671781b4fe64e11b" },
//   {
//     salePrice: -1,
//   },
//   { new: true, runValidators: true }
// )
//   .then((result) => console.log(result))
//   .catch((err) => console.log(err));
// saveCateCrawl();
// createDataCrawl();
// saveDataCrawl();

// Product.find({ $text: { $search: "Card" } })
//   .then((result) => console.log(result))
//   .catch((error) => console.log(error));
