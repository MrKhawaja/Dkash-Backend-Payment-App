const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

// Define your routes here e
app.use(express.json());
app.get("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "SELECT id, contact_phone, contact_name,is_fav FROM contacts WHERE phone = ?",
    phone,
    (err, results) => {
      if (err) throw err;
      res.status(200).send(JSON.stringify(results));
    }
  );
});

// app.use(express.urlencoded({ extended: true }));

// app.post("/", auth, uploads.single("picture"), (req, res) => {
//   const phone = req.decoded.phone;
//   const picture = req.file.filename;
//   const { contactPhone, contactName } = req.body;
//   const schema = Joi.object({
//     contactPhone: Joi.string().min(14).max(14).required(),
//     contactName: Joi.string().min(1).max(255).required(),
//   });
//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).send(error.details[0].message);
//   db.query(
//     "INSERT INTO contacts (phone, contact_phone, contact_name, contact_picture) VALUES (?, ?, ?,?)",
//     [phone, contactPhone, contactName, picture],
//     (err, results) => {
//       if (err) throw err;
//       res.status(201).send("Successfully Added");
//     }
//   );
// });

app.post("/", auth, (req, res) => {
  const phone = req.decoded.phone;
  // const picture = req.file.filename;
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

app.use(express.json());

app.put("/:id", auth, (req, res) => {
  const phone = req.decoded.phone;
  const id = req.params.id;
  const { contactPhone, contactName } = req.body;
  const schema = Joi.object({
    contactPhone: Joi.string().min(14).max(14).required(),
    contactName: Joi.string().min(1).max(255).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  db.query(
    "UPDATE contacts SET contact_phone = ?, contact_name = ? WHERE id = ? AND phone = ?",
    [contactPhone, contactName, id, phone],
    (err, results) => {
      if (err) throw err;
      res.status(200).send("Successfully Updated");
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

app.get("/fav", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "SELECT id, contact_phone, contact_name, contact_picture FROM contacts WHERE phone = ? AND is_fav = 1",
    phone,
    (err, results) => {
      if (err) throw err;
      res.status(200).send(results);
    }
  );
});

app.put("/fav/:id", auth, (req, res) => {
  const phone = req.decoded.phone;
  const id = req.params.id;
  db.query(
    "UPDATE contacts SET is_fav = 1 WHERE phone = ? AND id = ?",
    [phone, id],
    (err, results) => {
      if (err) throw err;
      res.status(201).send("Successfully Added");
    }
  );
});

// app.use(express.urlencoded({ extended: true }));

// app.post("/fav", auth, uploads.single("picture"), (req, res) => {
//   const phone = req.decoded.phone;
//   const picture = req.file.filename;
//   const { contactPhone, contactName } = req.body;
//   const schema = Joi.object({
//     contactPhone: Joi.string().min(14).max(14).required(),
//     contactName: Joi.string().min(1).max(255),
//   });
//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).send(error.details[0].message);
//   db.query(
//     "INSERT INTO contacts (phone, contact_phone, contact_name,contact_picture, is_fav) VALUES (?, ?, ?,?, 1)",
//     [phone, contactPhone, contactName, picture],
//     (err, results) => {
//       if (err) throw err;
//       res.status(201).send("Successfully Added");
//     }
//   );
// });
app.post("/fav", auth, (req, res) => {
  const phone = req.decoded.phone;
  const { contactPhone, contactName } = req.body;
  const schema = Joi.object({
    contactPhone: Joi.string().min(14).max(14).required(),
    contactName: Joi.string().min(1).max(255),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  db.query(
    "INSERT INTO contacts (phone, contact_phone, contact_name, is_fav) VALUES (?, ?, ?, 1)",
    [phone, contactPhone, contactName],
    (err, results) => {
      if (err) throw err;
      res.status(201).send("Successfully Added");
    }
  );
});

module.exports = app;
