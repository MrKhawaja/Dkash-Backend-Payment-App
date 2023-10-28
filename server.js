const express = require("express");
const app = express();
const multer = require("multer");
var cors = require("cors");

const port = 3001;
const db = require("./db");
const auth = require("./router/auth");

app.use(cors());
app.use(express.urlencoded({ extended: true }));

const uploads = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + ".pdf");
    },
  }),
});

app.use("/uploads", express.static(__dirname + "/uploads"));

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
  db.query(
    "create table if not exists users (phone varchar(14) not null primary key, name varchar(255) null , email varchar(255) null, pin varchar(255) not null, is_admin boolean default false, balance double(255,2) default 0.00);",
    (err, result) => {
      if (err) throw err;
      console.log("Users Table Initialized");
    }
  );
  db.query(
    "create table if not exists sms (phone varchar(14) not null primary key, code int not null);",
    (err, result) => {
      if (err) throw err;
      console.log("SMS Table Initialized");
    }
  );
});

app.use("/auth", auth);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
