const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return !users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: 'Error logging in. Username and password are required.' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(208).json({ message: 'Invalid Login. Check username and password.' });
  }

  const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });

  req.session.authorization = {
    accessToken,
    username,
  };

  return res.status(200).json({ message: 'User successfully logged in.' });
});

regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization ? req.session.authorization.username : null;

  if (!username) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }

  if (!review) {
    return res.status(400).json({ message: 'Review text is required as a query parameter.' });
  }

  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated.`,
    reviews: books[isbn].reviews,
  });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization ? req.session.authorization.username : null;

  if (!username) {
    return res.status(401).json({ message: 'User not logged in.' });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review by ${username} found for ISBN ${isbn}` });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `The review by ${username} for ISBN ${isbn} has been deleted.`,
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;