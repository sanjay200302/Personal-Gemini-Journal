const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  logger.info(`Analytics Agent running on port ${PORT}`);
});
