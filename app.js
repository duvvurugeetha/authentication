const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initial = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("error");
    process.exit(1);
  }
};
initial();
//register

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hPassword = await bcrypt.hash(password, 10);
  const selectQuery = `select * from user where username="${username}";`;
  const dbUser = await db.get(selectQuery);
  const length = password.length;
  if (dbUser === undefined) {
    if (length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `insert into user (username,name,password,gender,location) values
        ("${username}","${name}","${hPassword}","${gender}","${location}");`;
      await db.run(createUserQuery);

      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUser = `select * from user where username="${username}";`;
  const dbUser = await db.get(checkUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPassword === true) {
      const length = newPassword.length;
      if (length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `update user set password="${encryptPassword}" where 
               username="${username}" ;`;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username="${username}";`;
  const dbUser2 = await db.get(selectUserQuery);
  if (dbUser2 === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbUser2.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

module.exports = app;
