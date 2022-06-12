const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const urlDatabase = {};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
console.log(users);

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_registration", templateVars);
});

app.get("/urls/login", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Create a new short url
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect("/urls");       
});

// Edit url
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

// Delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Register
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  res.cookie('user_id', userID);

  if (req.body.email == "" || req.body.password == "") {
    // if email or password is empty
    res.sendStatus(400);
  } else if(emailExists(req.body.email)){
     // if someone tries to register with an email that is already in the users object
    res.sendStatus(400);
  } else {
    // update users object
    users[userID]= {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
  }
  console.log(users);
  res.redirect("/urls");   
});

// Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(emailExists(email)){
    let correctPassword = Object.values(users)
      .filter(function(user){ return user.email === email; })
      .map(function(user){ return user.password; })[0];

    if (password === correctPassword){
      let userID = Object.values(users)
        .filter(function(user){ return user.email === email; })
        .map(function(user){ return user.id; })[0];
      res.cookie('user_id', userID);
      res.redirect("/urls");
    } else {
      // if password is incorrect
      res.sendStatus(403);
      //console.log("wrong password")
    };
  } else {
    //If a user with that e-mail cannot be found
    res.sendStatus(403);
    //console.log("user not exist");
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log(users);
  res.redirect("/urls");
});

function emailExists(newEmail) {
  return Object.values(users).some(function(user) {
    return user.email === newEmail;
  }); 
}


function generateRandomString() {
  return Math.random().toString(20).slice(2, 8);
}