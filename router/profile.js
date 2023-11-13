const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

// Define your routes here

app.get("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "select phone,name,picture,email,balance from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) {
        return res.status(400).send("Invalid Token");
      }
      return res.status(200).send(result[0]);
    }
  );
});

app.post("/", (req, res) => {
  const token = req.headers["token"];
  const { name, email } = req.body;
  const phone = req.decoded.phone;
  db.query(
    "update users set name = ?, email = ? where phone = ?",
    [name, email, phone],
    (err, result) => {
      if (err) throw err;
      return res.status(200).send("Profile Updated");
    }
  );
});

app.post("/picture", auth, uploads.single("image"), (req, res) => {
  const phone = req.decoded.phone;
  const picture = req.file.filename;
  db.query(
    "update users set picture = ? where phone = ?",
    [picture, phone],
    (err, result) => {
      if (err) throw err;
      return res.status(200).send("Profile Updated");
    }
  );
});

module.exports = app;
