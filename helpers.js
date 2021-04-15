const generateRandomString = (length) => {
  let result = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  
  return result.join('');
};

const getUserByEmail = (users, email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

const formsAreEmpty = (req) => {
  if (!req.body.email || !req.body.password) {
    return true;
  }
  return false;
};

const checkPassword = (users, req) => {
  if (bcrypt.compareSync(req.body.password, getUserByEmail(users, req.body.email).password)) {
    return true;
  }
  return false;
};

const urlsForUser = (urlDatabase, req) => {
  let result = {};
  
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === req.session.user_id) {
      result[i] = urlDatabase[i];
    }
  }
  return result;
};

module.exports = { 
  generateRandomString, 
  getUserByEmail, 
  formsAreEmpty ,
  checkPassword,
  urlsForUser
};