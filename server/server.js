const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    message: "BookFlow API is running",
  });
});

app.listen(PORT, () => {
  console.log(`BookFlow server running on http://localhost:${PORT}`);
});
