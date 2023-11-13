const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

// Define your routes here

app.post("/send", auth, (req, res) => {
  const phone = req.decoded.phone;

  db.query("select money from users where phone = ?");
});

module.exports = app;
