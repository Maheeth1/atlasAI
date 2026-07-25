const express = require("express");
const cors = require("cors");

const healthRoute = require("./routes/health.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoute);

module.exports = app;