const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const ordersRoute = require("./routes/orders");

const dotenv = require("dotenv");
const app = express();
dotenv.config();

app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api/orders", ordersRoute);

app.get("/", (req, res) => {
  res.send("Hello, E-commerce API");
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
