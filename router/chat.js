const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const { jwt_secret, uploads, host } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Define your routes here

app.use(express.json());

app.get("/", auth, (req, res) => {
  db.query(
    "select * from chats where user=?",
    [req.decoded.phone],
    (err, result) => {
      if (err) throw err;
      res.status(200).send(result);
    }
  );
});

app.post("/", auth, (req, res) => {
  const schema = Joi.object({
    subject: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { subject } = req.body;
  db.query(
    "insert into chats (user,subject) values (?,?)",
    [req.decoded.phone, subject],
    (err, result) => {
      if (err) throw err;
      res.status(200).send("Chat Created");
    }
  );
});

app.get("/:id", auth, (req, res) => {
  db.query(
    "select * from chats where id=? and user=?",
    [req.params.id, req.decoded.phone],
    (err, result) => {
      if (err) throw err;
      if (result.length == 0) return res.status(404).send("Chat Not Found");

      db.query(
        "select * from messages where chat_id=? order by date asc",
        [req.params.id],
        (err, result) => {
          if (err) throw err;
          res.status(200).send(result);
        }
      );
    }
  );
});

app.post("/message", auth, (req, res) => {
  const schema = Joi.object({
    message: Joi.string().required(),
    id: Joi.number().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { message, id } = req.body;
  db.query(
    "select * from chats where id=? and user=?",
    [id, req.decoded.phone],
    (err, result) => {
      if (err) throw err;
      if (result.length == 0) return res.status(404).send("Chat Not Found");

      db.query(
        "insert into messages (chat_id,message,sender) values (?,?,?)",
        [id, message, req.decoded.phone],
        (err, result) => {
          if (err) throw err;
          res.status(200).send("Message Sent");
        }
      );
    }
  );
});

module.exports = app;
