const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const urlDatabase = {};

const users = {};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
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
  const userID = req.session.user_id;
  const templateVars = { 
    urls: [],
    user: users[userID]
  };
  templateVars.urls = urlsForUser(userID);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.session.user_id]
  };

  if (typeof templateVars.user === "undefined"){
    // if user is not logged in
    res.redirect("/urls/login");
  } else {
    res.render("urls_new", templateVars);
  }

});

app.get("/urls/register", (req, res) => {
  const templateVars = { 
    user: users[req.session.user_id]
  };
  
  if (typeof templateVars.user !== "undefined"){
    // if user is logged in
    res.redirect("/urls");
  } else {
    res.render("urls_registration", templateVars);
  }
});

app.get("/urls/login", (req, res) => {
  const templateVars = { 
    user: users[req.session.user_id]
  };
  
  if (typeof templateVars.user !== "undefined"){
    // if user is logged in
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }

});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const id = req.params.id;
  const templateVars = { 
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]["longURL"],
    user: users[userID]
  };

  if(shortUrlsForUser(userID).includes(id)){
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("Requested URL does not belong to user");
  }
  
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]["longURL"]);
});

// Create a new short url
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();

  if (req.session.user_id === ""){
    // if user is not logged in
    res.status(400).send("Please login first");
  } else {
    urlDatabase[newShortURL] = {
      shortURL: newShortURL,
      longURL: req.body.longURL,
      userID: req.session.user_id
    };

    res.redirect("/urls");   
  }
  console.log(urlDatabase);
});

// Edit url
app.post("/urls/:id", (req, res) => {
  const url = req.params.id;
  const id = req.session.user_id;

  if(shortUrlsForUser(id).includes(url)){
    urlDatabase[url]["longURL"] = req.body.newURL;
    res.redirect("/urls");
    console.log(urlDatabase);
  } else {
    res.status(400).send("You're not allowed to edit this URL.");
  }

});

// Delete url
app.post("/urls/:id/delete", (req, res) => {
  const url = req.params.id;
  const id = req.session.user_id;

  if(shortUrlsForUser(id).includes(url)){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
    console.log(urlDatabase);
  } else {
    res.status(400).send("You're not allowed to delete this URL.");
  }
  
});

// Register
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  req.session.user_id = userID;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (req.body.email == "" || req.body.password == "") {
    // if email or password is empty
    res.status(400).send("Cannot leave fields empty");
  } else if(emailExists(req.body.email)){
     // if someone tries to register with an email that is already in the users object
    res.status(400).send("User already exists");
  } else {
    // update users object
    users[userID]= {
      id: userID,
      email: req.body.email,
      password: hashedPassword
    };
  }
  console.log(users);
  res.redirect("/urls");   
});

// Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === ""){
    res.status(400).send("Cannot leave fields empty");
  } else {
    if(emailExists(email)){
      let correctPassword = Object.values(users)
        .filter(function(user){ return user.email === email; })
        .map(function(user){ return user.password; })[0];
       
      if (bcrypt.compareSync(password, correctPassword)){
        let userID = Object.values(users)
          .filter(function(user){ return user.email === email; })
          .map(function(user){ return user.id; })[0];
          req.session.user_id = userID;
        res.redirect("/urls");
      } else {
        // if password is incorrect
        res.status(403).send("User Not Found");
      };
    } else {
      //If a user with that e-mail cannot be found
      res.status(403).send("Email or Password does not match records");

    };
  };
});

// Logout
app.post("/logout", (req, res) => {
  req.session.user_id = "";
  console.log(users);
  res.redirect("/urls");
});

// Functions
function emailExists(newEmail) {
  return Object.values(users).some(function(user) {
    return user.email === newEmail;
  }); 
}

function shortUrlsForUser(id) {
  return Object.keys(urlDatabase).filter(
    function(key) {
      return urlDatabase[key]["userID"] === id }
  );
}

function urlsForUser(id) {
  return Object.values(urlDatabase)
    .filter(function(url){ return url.userID === id; })
    // .map(function(url){ return url.longURL; });
}
        
function generateRandomString() {
  return Math.random().toString(20).slice(2, 8);
}