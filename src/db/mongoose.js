const mongoose = require("mongoose");

// "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath="c:\data\db"

mongoose
  .connect("mongodb://127.0.0.1:27017/book-store", {
    autoIndex: true,
  })
  .then(() => console.log("DB mongodb connection is ON"))
  .catch(() => console.log("DB mongodb connection FAIL"));
