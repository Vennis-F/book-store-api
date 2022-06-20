const express = require("express")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const userRouter = require("./routers/user")
const categoriesRouter = require("./routers/categories")
const productsRouter = require("./routers/products")
const cartRouter = require("./routers/cart")
const rolesRouter = require("./routers/role")
const checkoutRouter = require("./routers/checkout")
const ordersRouter = require("./routers/orders")
const app = express()
const port = process.env.PORT || 3000

//Config
require("./db/mongoose")
app.use(express.json())

//Session
app.use(
  session({
    secret: "Asu",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 180000,
      secure: false,
    },
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/book-store", //YOUR MONGODB URL
      // ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),
  })
)

//Config express
app.use("/user", userRouter)
app.use("/categories", categoriesRouter)
app.use("/products", productsRouter)
app.use("/roles", rolesRouter)
app.use("/cart", cartRouter)
app.use("/checkout", checkoutRouter)
app.use("/orders", ordersRouter)

require("./models/slider")

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
