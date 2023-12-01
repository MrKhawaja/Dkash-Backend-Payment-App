const express = require("express");
const app = express.Router();
const { jwt_secret } = require("../config");
const Joi = require("joi");
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());

app.post("/register", (req, res) => {
  const schema = Joi.object({
    phone: Joi.string().min(14).max(14).required(),
    pin: Joi.number().min(100000).max(999999).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const phone = value.phone;
  const pin = value.pin.toString();
  db.query(
    "select phone from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        return res.status(400).send("You have already registered.");
      }
      bcrypt.hash(pin, 10, (err, hash) => {
        if (err) throw err;
        db.query(
          "insert into users (phone,pin) values (?,?)",
          [phone, hash],
          (err, result) => {
            if (err) throw err;
            const token = jwt.sign(
              {
                phone: phone,
                name: null,
                picture: null,
                balance: 0,
                email: null,
                type: "user",
              },
              jwt_secret
            );
            res.status(200).send(token);
          }
        );
      });
    }
  );
});
app.post("/login", (req, res) => {
  const schema = Joi.object({
    phone: Joi.string().min(14).max(14).required(),
    pin: Joi.number().min(100000).max(999999).required(),
  });
  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const phone = value.phone;
  const pin = value.pin.toString();

  db.query("select * from users where phone = ?", [phone], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.status(400).send("User not found");
    }
    bcrypt.compare(pin, result[0].pin, (err, response) => {
      if (err) throw err;
      if (response) {
        const token = jwt.sign(
          {
            phone: result[0].phone,
            name: result[0].name,
            picture: result[0].picture,
            balance: result[0].balance,
            email: result[0].email,
            type: result[0].type,
          },
          jwt_secret
        );
        return res.status(200).send(token);
      } else {
        return res.status(400).send("Wrong Pin");
      }
    });
  });
});

module.exports = app;

// middleware that is specific to this router
// router.use((req, res, next) => {
//   console.log('Time: ', Date.now())
//   next()
// })
// define the home page route
// app.post("/code", (req, res) => {
//   const schema = Joi.object({
//     phone: Joi.string().min(14).max(14).required(),
//   });
//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).send(error.details[0].message);
//   }
//   const phone = value.phone;
//   db.query(
//     "select phone from users where phone = ?",
//     [phone],
//     (err, result) => {
//       if (err) throw err;
//       if (result.length > 0) {
//         return res.status(400).send("You have already registered.");
//       }
//       const code = Math.floor(100000 + Math.random() * 900000);
//       db.query(
//         "insert into sms (phone,code) values (?,?) on duplicate key update code = ?",
//         [phone, code, code],
//         (err, result) => {
//           if (err) throw err;
//           console.log(code);
//           res.status(200).send("Code Sent");
//         }
//       );
//     }
//   );
// });
// app.post("/code/verify", (req, res) => {
//   const schema = Joi.object({
//     phone: Joi.string().min(14).max(14).required(),
//     code: Joi.number().min(100000).max(999999).required(),
//   });
//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).send(error.details[0].message);
//   }
//   const phone = value.phone;
//   const code = value.code;
//   db.query(
//     "select phone from sms where phone = ? and code = ?",
//     [phone, code],
//     (err, result) => {
//       if (err) throw err;
//       if (result.length <= 0) {
//         return res.status(400).send("Invalid Code");
//       }
//       res.status(200).send("Code Verified");
//     }
//   );
// });
