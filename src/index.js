const express = require("express")
const userRouter = require("./routers/user")
const app = express()
const port = process.env.PORT || 3000

//Config
require("./db/mongoose")
app.use(express.json())

//Config express
app.use("/user", userRouter)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
