const express = require("express");
const app = express();
const multer = require("multer");
var cors = require("cors");

const { port } = require("./config");
const db = require("./db");
const authentication = require("./router/auth");
const profile = require("./router/profile");
const money = require("./router/money");

app.use(cors());
// app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(__dirname + "/uploads"));

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
  db.query(
    "create table if not exists users (phone varchar(14) not null primary key, name varchar(255) null , picture varchar(255) null, email varchar(255) null, pin varchar(255) not null, type enum('user','agent','merchant') default 'user', balance double(255,2) default 0.00);",
    (err, result) => {
      if (err) throw err;
      console.log("Users Table Initialized");
    }
  );
  // db.query(
  //   "create table if not exists sms (phone varchar(14) not null primary key, code int not null);",
  //   (err, result) => {
  //     if (err) throw err;
  //     console.log("SMS Table Initialized");
  //   }
  // );
  db.query(
    "create table if not exists transactions (sender varchar(255) not null, receiver varchar(255) not null, amount double(255,2), type enum('send_money','payment','cashout','add_money','loan','recharge'),date datetime default now());",
    (err, result) => {
      if (err) throw err;
      console.log("Transactions Table Initialized");
    }
  );
});

app.use("/auth", authentication);
app.use("/profile", profile);
app.use("/money", money);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
