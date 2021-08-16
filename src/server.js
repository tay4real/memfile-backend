const express = require("express");
const cors = require("cors");
const { join } = require("path");
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const { httpErrorHandler } = require("./utils/errorHandler");

const server = express();

const whitelist = [process.env.FE_URL];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

server.use(cors(corsOptions));
const staticFolderPath = join(__dirname, "../public");

server.use(express.static(staticFolderPath));
server.use(express.json());

server.use(cookieParser());
// simple route
server.get("/", (req, res) => {
  res.json({ message: "Welcome to E-filing application." });
});
server.use("/api", routes);

// Error handler middlewares
server.use(httpErrorHandler);

console.log(listEndpoints(server));

const port = process.env.PORT || 5000;

mongoose
  .connect(`${process.env.MONGO_CONNECTION}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("✅ DB connection success"))
  .catch((error) => {
    console.error(" ❌ Error : DB connection failed :  " + error);
    process.exit();
  });

server.listen(port, () => {
  console.info("✅  Backend Server is running on port " + port);
});
