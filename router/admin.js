const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const { jwt_secret, uploads, host } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Define your routes here

app.use(express.json());

app.get("/chat", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }

  db.query("select * from chats", (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
});

app.get("/chat/:id", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }
  db.query(
    "select * from messages where chat_id=? order by date asc",
    [req.params.id],
    (err, result) => {
      if (err) throw err;
      res.status(200).send(result);
    }
  );
});

app.post("/chat/message", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }
  const schema = Joi.object({
    id: Joi.number().required(),
    message: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  db.query(
    "insert into messages (chat_id,sender,message) values (?,?,?)",
    [req.body.id, req.decoded.phone, req.body.message],
    (err, result) => {
      if (err) throw err;
      res.status(200).send("Message Sent");
    }
  );
});

app.get("/users", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }
  db.query("select * from users", (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
});

app.get("/transactions", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }
  db.query("select * from transactions", (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
});

app.get("/graph", auth, (req, res) => {
  if (req.decoded.type != "admin") {
    return res.status(401).send("Unauthorized");
  }
  db.query(
    "SELECT date, minute(date), count(*) as count FROM transactions GROUP BY minute(date),date;",
    (err, result) => {
      if (err) throw err;

      res.status(200).send(result);
    }
  );
});

module.exports = app;
