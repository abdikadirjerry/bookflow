const express = require("express");

const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
  res.json({
    message: "BookFlow API is running",
  });
});

app.listen(PORT, () => {
  console.log(`BookFlow server running on http://localhost:${PORT}`);
});
