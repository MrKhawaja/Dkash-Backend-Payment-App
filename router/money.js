const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { jwt_secret, uploads } = require("../config");
const db = require("../db");
const auth = require("../middleware/auth");

const validate = (body) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).required(),
    receiver: Joi.string().min(14).max(14).required(),
  });
  return schema.validate(body);
};

const pendingLoan = (loan, loanTaken) => {
  const old = new Date(loanTaken).getTime();
  const now = new Date().getTime();
  const difference = (now - old) / (1000 * 60 * 60 * 24);

  return parseInt(loan * (0.02 * difference) + loan);
};

app.use(express.json());

app.post("/send", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  var fees = 5 + 0.001 * amount;

  db.beginTransaction((err) => {
    if (err) throw err;

    db.query(
      "select phone from users where phone = ?",
      [receiver],
      (err, result) => {
        if (err) throw err;
        if (result.length <= 0) {
          return res.status(400).send("Receiver not found");
        }
        db.query(
          "select is_fav from contacts where phone = ? and contact_phone = ?",
          [phone, receiver],
          (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
              const is_fav = result[0].is_fav;
              if (is_fav) {
                fees = 0;
              }
            }
            db.query(
              "select balance from users where phone = ?",
              [phone],
              (err, result) => {
                if (err) throw err;
                const balance = result[0].balance;
                if (balance < amount + fees)
                  return res.status(400).send("Insufficient balance");

                db.query(
                  "update users set balance = balance - ? where phone = ?",
                  [amount + fees, phone],
                  (err, result) => {
                    if (err) throw err;
                    db.query(
                      "update users set balance = balance + ? where phone = ?",
                      [amount, receiver],
                      (err, result) => {
                        if (err) {
                          return db.rollback(() => {
                            throw err;
                          });
                        }
                        db.query(
                          "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                          [phone, receiver, amount, "send_money"],
                          (err, result) => {
                            if (err) {
                              return db.rollback(() => {
                                throw err;
                              });
                            }
                            db.commit((err) => {
                              if (err) {
                                return db.rollback(() => {
                                  throw err;
                                });
                              }
                              res.send("Money sent successfully");
                            });
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

app.post("/add", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  const type = req.decoded.type;
  if (type != "agent") return res.status(400).send("Only agents can add money");
  db.query(
    "select phone from users where phone = ?",
    [receiver],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) return res.status(400).send("Receiver not found");
      db.query(
        "select balance from users where phone = ?",
        [phone],
        (err, result) => {
          if (err) throw err;
          const balance = result[0].balance;
          if (balance < amount)
            return res.status(400).send("Insufficient balance");
          db.beginTransaction((err) => {
            if (err) throw err;

            db.query(
              "update users set balance = balance - ? where phone = ?",
              [amount, phone],
              (err, result) => {
                if (err) throw err;
                db.query(
                  "update users set balance = balance + ? where phone = ?",
                  [amount, receiver],
                  (err, result) => {
                    if (err) {
                      return db.rollback(() => {
                        throw err;
                      });
                    }
                    db.query(
                      "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                      [phone, receiver, amount, "add_money"],
                      (err, result) => {
                        if (err) {
                          return db.rollback(() => {
                            throw err;
                          });
                        }
                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => {
                              throw err;
                            });
                          }
                          res.status(200).send("Money added successfully");
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

app.post("/cashout", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  const fees = 0.02 * amount;
  db.query(
    "select balance from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      const balance = result[0].balance;
      if (balance < amount + fees)
        return res.status(400).send("Insufficient balance");
      db.query(
        "select * from users where phone = ? and type = 'agent'",
        [receiver],
        (err, result) => {
          if (err) throw err;
          if (result.length <= 0)
            return res.status(400).send("Agent not found");
          db.beginTransaction((err) => {
            if (err) throw err;

            db.query(
              "update users set balance = balance - ? where phone = ?",
              [amount + fees, phone],
              (err, result) => {
                if (err) throw err;
                db.query(
                  "update users set balance = balance + ? where phone = ?",
                  [amount + fees / 2, receiver],
                  (err, result) => {
                    if (err) {
                      return db.rollback(() => {
                        throw err;
                      });
                    }
                    db.query(
                      "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                      [phone, receiver, amount, "cashout"],
                      (err, result) => {
                        if (err) {
                          return db.rollback(() => {
                            throw err;
                          });
                        }
                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => {
                              throw err;
                            });
                          }
                          res.status(200).send("Cashout successful");
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

app.post("/pay", auth, (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount, receiver } = value;
  const phone = req.decoded.phone;
  var fees = 5 + 0.001 * amount;
  db.query(
    "select balance from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      const balance = result[0].balance;
      if (balance < amount) return res.status(400).send("Insufficient balance");
      db.query(
        "select * from users where phone = ? and type = 'merchant'",
        [receiver],
        (err, result) => {
          if (err) throw err;
          if (result.length <= 0)
            return res.status(400).send("Merchant not found");
          db.beginTransaction((err) => {
            if (err) throw err;
            db.query(
              "update users set balance = balance - ? where phone = ?",
              [amount, phone],
              (err, result) => {
                if (err) throw err;
                db.query(
                  "update users set balance = balance + ? where phone = ?",
                  [amount - fees, receiver],
                  (err, result) => {
                    if (err) {
                      return db.rollback(() => {
                        throw err;
                      });
                    }
                    db.query(
                      "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
                      [phone, receiver, amount, "pay"],
                      (err, result) => {
                        if (err) {
                          return db.rollback(() => {
                            throw err;
                          });
                        }
                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => {
                              throw err;
                            });
                          }
                          res.status(200).send("Payment successful");
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

app.post("/loan", auth, (req, res) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount } = value;
  const phone = req.decoded.phone;
  const type = req.decoded.type;
  if (type != "user") return res.status(400).send("Only users can take loan");
  if (amount > 5000) return res.status(400).send("Loan amount too high");
  db.query("select * from users where phone = ?", [phone], (err, result) => {
    if (err) throw err;
    if (result.length <= 0) return res.status(400).send("User not found");
    if (result[0].loan > 0)
      return res.status(400).send("You have an outstanding loan");
    db.query(
      "update users set loan = ?, balance = balance + ?, loan_taken = now() where phone = ?",
      [amount, amount, phone],
      (err, result) => {
        if (err) throw err;
        db.query(
          "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
          [phone, phone, amount, "loan"],
          (err, result) => {
            if (err) throw err;
            res.status(200).send("Loan taken successfully");
          }
        );
      }
    );
  });
});

app.get("/loan", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "select loan,loan_taken from users where phone = ?",
    [phone],
    (err, result) => {
      if (err) throw err;
      if (result.length <= 0) return res.status(400).send("User not found");

      res
        .status(200)
        .send(pendingLoan(result[0].loan, result[0].loan_taken).toString());
    }
  );
});

app.post("/loan/pay", auth, (req, res) => {
  const schema = Joi.object({
    amount: Joi.number().min(1).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { amount } = value;
  const phone = req.decoded.phone;
  const type = req.decoded.type;

  db.query("select * from users where phone = ?", [phone], (err, result) => {
    if (err) throw err;
    if (result.length <= 0) return res.status(400).send("User not found");
    if (result[0].loan <= 0)
      return res.status(400).send("You have no outstanding loan");
    const loan = pendingLoan(result[0].loan, result[0].loan_taken);
    if (amount > loan)
      return res.status(400).send("Amount is greater than loan");
    db.query(
      "update users set loan = loan - ?, balance = balance - ?, loan_taken = now() where phone = ?",
      [amount, amount, phone],
      (err, result) => {
        if (err) throw err;
        db.query(
          "insert into transactions (sender,receiver,amount,type) values (?,?,?,?)",
          [phone, phone, amount, "loan_repay"],
          (err, result) => {
            if (err) throw err;
            res.status(200).send("Loan paid successfully");
          }
        );
      }
    );
  });
});

app.get("/transactions", auth, (req, res) => {
  const phone = req.decoded.phone;
  db.query(
    "select * from transactions where sender = ? or receiver = ? limit 10",
    [phone, phone],
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

module.exports = app;
