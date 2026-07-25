require("dotenv").config();
const app = require("./app");
const config = require("./config/config");
const logger = require("./utils/logger");

const PORT = config.port;

app.listen(PORT, () => {
    logger.info(`Backend running on ${PORT}`);
});