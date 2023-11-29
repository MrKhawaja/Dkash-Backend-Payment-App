const multer = require("multer");

const jwt_secret = process.env.JWT_SECRET;
const port = process.env.PORT;
const domain = process.env.DOMAIN;
const host = "http://" + domain + ":" + port;
const uploads = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + Date.now() + file.originalname.replace(/\s/g, "-")
      );
    },
  }),
});

module.exports = { jwt_secret, port, uploads, host };
