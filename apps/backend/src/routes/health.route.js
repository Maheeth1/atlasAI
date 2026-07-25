const express = require("express");
const { version } = require("react");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        status: "ok",
        backend: true,
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

module.exports = router;