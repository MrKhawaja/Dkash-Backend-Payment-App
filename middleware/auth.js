const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../config");

const auth = (req, res, next) => {
  const token = req.headers["token"];
  jwt.verify(token, jwt_secret, (err, decoded) => {
    req.decoded = decoded;
    if (err) return res.status(401).send("Invalid Token");
    next();
  });
};

module.exports = auth;
