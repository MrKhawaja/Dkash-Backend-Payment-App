const express = require("express");
const app = express();
const multer = require("multer");
var cors = require("cors");

const { port } = require("./config");
const db = require("./db");
const authentication = require("./router/auth");
const profile = require("./router/profile");
const money = require("./router/money");
const contacts = require("./router/contacts");
const admin = require("./router/admin");
const chat = require("./router/chat");

app.use(cors());
// app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(__dirname + "/uploads"));

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
  db.query(
    "create table if not exists users (phone varchar(14) not null primary key, name varchar(255) null , picture varchar(255) null, email varchar(255) null, pin varchar(255) not null, type enum('user','agent','merchant','admin') default 'user', balance double(255,2) default 0.00, loan double(255,2) default 0.00, loan_taken timestamp );",
    (err, result) => {
      if (err) throw err;
      console.log("Users Table Initialized");
      db.query(
        "create table if not exists contacts (id bigint auto_increment primary key, phone varchar(14) not null, contact_phone varchar(14) not null, contact_name varchar(255) null, contact_picture varchar(255) null, is_fav boolean default false,  foreign key (phone) references users(phone));",
        (err, result) => {
          if (err) throw err;
          console.log("Contacts Table Initialized");
        }
      );
      db.query(
        "create table if not exists chats (id bigint auto_increment primary key, user varchar(14) not null,subject varchar(255), status enum('open','closed') default 'open', last TIMESTAMP Default now() on update now(), foreign key (user) references  users(phone));",
        (err, result) => {
          if (err) throw err;
          console.log("Chats Table Initialized");
          db.query(
            "create table if not exists messages (id bigint auto_increment primary key, chat_id bigint not null, sender varchar(14) not null,  message varchar(500) not null, date timestamp default now(), foreign key (chat_id) references chats(id), foreign key (sender) references users(phone));",
            (err, result) => {
              if (err) throw err;
              console.log("Messages Table Initialized");
            }
          );
        }
      );
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
    "create table if not exists transactions (sender varchar(255) not null, receiver varchar(255) not null, amount double(255,2), type enum('send_money','payment','cashout','add_money','loan','recharge','loan_repay'),date datetime default now(), foreign key (sender) references users(phone));",
    (err, result) => {
      if (err) throw err;
      console.log("Transactions Table Initialized");
    }
  );
});

app.use("/auth", authentication);
app.use("/profile", profile);
app.use("/money", money);
app.use("/contacts", contacts);
app.use("/admin", admin);
app.use("/chat", chat);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
