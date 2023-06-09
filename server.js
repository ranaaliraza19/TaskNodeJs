const mongoose = require("mongoose");
require("dotenv").config({
  path: "./.env",
});
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB connection successful!"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Server listening at PORT ${PORT}`);
});
