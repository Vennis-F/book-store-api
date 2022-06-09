const express = require("express")
const userRouter = require("./routers/user")
const categoriesRouter = require("./routers/categories")
const productsRouter = require("./routers/products")
const cartRouter = require("./routers/cart")
const app = express()
const port = process.env.PORT || 3000

//Config
require("./db/mongoose")
app.use(express.json())

//Config express
app.use("/user", userRouter)
app.use("/categories", categoriesRouter)
app.use("/products", productsRouter)
app.use("/products", productsRouter)
app.use("/cart", cartRouter)

//Test

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
