const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const users = testUsers;
    const user = getUserByEmail(users, "user@example.com").id
    const expectedOutput = "userRandomID";
    
    assert.equal(user, expectedOutput)
  });

  it('should return undefined if passed a nonexistent email', function() {
    const users = testUsers;
    const user = getUserByEmail(users, "nothing@example.com")
    
    assert.isUndefined(user);
  });
});