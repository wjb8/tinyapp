const express = require('express');
const app = express();
const PORT = 8080; //default port
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const generateRandomString = (length) => {
  let result = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  
  return result.join('');
};

const formsAreEmpty = (req) => {
  if (!req.body.email || !req.body.password) {
    return true;
  }
  return false;
};

const getUserByEmail = (users, req) => {
  for (let user in users) {
    if (users[user].email === req.body.email) {
      return users[user];
    }
  }
};

const checkPassword = (users, req) => {
  if (bcrypt.compareSync(req.body.password, getUserByEmail(users, req).password)) {
    return true;
  }
  return false;
};

const urlsForUser = (urlDatabase, req) => {
  let result = {};
  
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === req.cookies['user_id']) {
      result[i] = urlDatabase[i];
    }
  }
  return result;
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.ca", userID: "user2RandomID"}
};

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

app.get('/', (req, res) => {
  res.send('Hello! Welcome to TinyApp!');
});

app.get('/login', (req, res) => { //=>Render the login page
  const user = req.cookies['user_id'];
  const templateVars = {user: users[user]};
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {  //=>Handle login form submission
  
  if (formsAreEmpty(req)) {
    res.statusCode = 400;
    res.send('Error: forms are empty');
    return;
  }

  if (!getUserByEmail(users, req)) {
    res.statusCode = 403;
    res.send('Error: User does not exist');
    return;
  }

  if (!checkPassword(users, req)) {
    res.statusCode = 403;
    res.send('Error: Incorrect password');
    return;
  }

  res.cookie('user_id', getUserByEmail(users, req).id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => { //=>Clear user_id cookie on logout
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {  //=>Render the register page
  const user = req.cookies['user_id'];
  const templateVars = {user: users[user]};
  res.render('register', templateVars);
});

app.post('/register', (req, res) => { //=>Handle register form submission
  
  if (formsAreEmpty(req)) {
    res.statusCode = 400;
    res.send('Error: forms are empty');
    return;
  }

  if (getUserByEmail(users, req)) {
    res.statusCode = 403;
    res.send('Error: User already exists');
    return;
  }

  const id = generateRandomString(6);
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[id] = {id: id, email: req.body.email, password: hashedPassword};
  res.cookie('user_id', getUserByEmail(users, req).id);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {  //=>Render My URLs page
  const user = req.cookies['user_id'];
  const userURLs = urlsForUser(urlDatabase, req);
  const templateVars = {user: users[user], urls: userURLs};
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => { //=> Create new URL
  const user = req.cookies['user_id'];

  if (req.body.longURL.startsWith('http://') || req.body.longURL.startsWith('https://')) {
    const shortened = generateRandomString(6);
    urlDatabase[shortened] = {longURL: req.body.longURL, userID: user};
    res.redirect(`/urls/${shortened}`);
  } else {
    res.statusCode = 405;
    res.send('Error: URL must begin with http:// or https://');
  }

  
});

app.get("/urls/new", (req, res) => {  //=>Render create new URL page
  const user = req.cookies['user_id'];
  
  if (!user) {
    res.redirect('/login');
    return;
  }
  
  const templateVars = {user: users[user]};
  res.render("urls_new", templateVars);
});

app.get('/u/:shortURL', (req, res) => { //=>Redirect to long URL
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {  //=>Render short URL update page
  const user = req.cookies['user_id'];
  const templateVars = {user: users[user], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {  //=>Handle short URL delete
  const user = req.cookies['user_id'];
  if (user !== urlDatabase[req.params.shortURL].userID) {
    res.statusCode = 401;
    res.send('Error: Unauthorized user');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/update', (req, res) => {  //=>Handle short URL update
  const user = req.cookies['user_id'];
  if (user !== urlDatabase[req.params.shortURL].userID) {
    res.statusCode = 401;
    res.send('Error: Unauthorized user');
    return;
  }

  if (req.body.longURL.startsWith('http://') || req.body.longURL.startsWith('https://')) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.statusCode = 405;
    res.send('Error: URL must start with http:// or https://');
  }

});

app.get('/urls.json', (req, res) => { //=>List all short URLs in database
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});