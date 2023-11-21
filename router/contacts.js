const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

// Define your routes here
app.use(express.json());
app.get("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "SELECT id, contact_phone, contact_name FROM contacts WHERE phone = ?",
    phone,
    (err, results) => {
      if (err) throw err;
      res.status(200).send(results);
    }
  );
});

app.post("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  const { contactPhone, contactName } = req.body;
  const schema = Joi.object({
    contactPhone: Joi.string().min(14).max(14).required(),
    contactName: Joi.string().min(1).max(255).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  db.query(
    "INSERT INTO contacts (phone, contact_phone, contact_name) VALUES (?, ?, ?)",
    [phone, contactPhone, contactName],
    (err, results) => {
      if (err) throw err;
      res.status(201).send("Successfully Added");
    }
  );
});

app.delete("/:id", auth, (req, res) => {
  const phone = req.decoded.phone;
  const id = req.params.id;
  db.query(
    "DELETE FROM contacts WHERE id = ? and phone = ?",
    [id, phone],
    (err, results) => {
      if (err) throw err;
      res.status(200).send("Successfully Deleted");
    }
  );
});

module.exports = app;
