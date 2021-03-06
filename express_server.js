const express = require("express");
const methodOverride = require('method-override');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');

const urlDatabase = {};
const users = {};

app.use(methodOverride('_method'));
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
app.put("/urls/:id", (req, res) => {
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
app.delete("/urls/:id", (req, res) => {
  const url = req.params.id;
  const id = req.session.user_id;

  if(shortUrlsForUser(id).includes(url)){
    delete urlDatabase[url];
    res.redirect("/urls");
    console.log(urlDatabase);
  } else {
    res.status(400).send("You're not allowed to delete this URL.");
  }
  
});

// Register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email == "" || password == "") {
    // if email or password is empty
    res.status(400).send("Cannot leave fields empty");
  } else {
     // if someone tries to register with an email that is already in the users object
     let user = getUserByEmail(email, users);
     if (user){
       res.status(400).send("User already exists");
     } else {
      // update users object
      let id = generateRandomString();
      users[id] = {
        id: id,
        email: email,
        password: hashedPassword
      };
      req.session.user_id = id;
      console.log(users);
      res.redirect("/urls");  
    } 
  }
});

// Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === ""){
    res.status(400).send("Cannot leave fields empty");
  } else {
    let user = getUserByEmail(email, users);
    if (!user ){
      res.status(403).send("User Not Found");
    } else {
      if (bcrypt.compareSync(password, user.password)){
        req.session.user_id = user.id;
        res.redirect("/urls");
      } else {
        res.status(403).send("Password does not match records");
      }
    } 
  };
});

// Logout
app.post("/logout", (req, res) => {
  req.session.user_id = "";
  console.log(users);
  res.redirect("/urls");
});

// Functions
function generateRandomString() {
  return Math.random().toString(20).slice(2, 8);
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

  