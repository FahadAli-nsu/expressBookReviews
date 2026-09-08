const express = require('express');
let books = require('./booksdb.js');
let { isValid, users } = require('./auth_users.js');
const axios = require('axios');
const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: 'Username and password are required.' });
  }

  if (!isValid(username)) {
    return res.status(404).json({ message: 'Username already exists.' });
  }

  users.push({ username, password });
  return res.status(200).json({ message: 'User successfully registered. Now you can login.' });
});

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

public_users.get('/', async function (req, res) {
  try {
    const response = await axios.get(`${getBaseUrl(req)}/internal/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving book list.', error: error.message });
  }
});

public_users.get('/internal/books', (req, res) => {
  return res.status(200).json(books);
});

public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`${getBaseUrl(req)}/internal/books`);
    const allBooks = response.data;
    const book = allBooks[isbn];

    if (!book) {
      return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
    }
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving book by ISBN.', error: error.message });
  }
});

public_users.get('/author/:author', function (req, res) {
  const author = req.params.author.toLowerCase();

  axios
    .get(`${getBaseUrl(req)}/internal/books`)
    .then((response) => {
      const allBooks = response.data;
      const matches = Object.keys(allBooks)
        .filter((isbn) => allBooks[isbn].author.toLowerCase() === author)
        .map((isbn) => ({ isbn, ...allBooks[isbn] }));

      if (matches.length === 0) {
        return res.status(404).json({ message: `No books found for author "${req.params.author}"` });
      }
      return res.status(200).json(matches);
    })
    .catch((error) => {
      return res.status(500).json({ message: 'Error retrieving books by author.', error: error.message });
    });
});

public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title.toLowerCase();

  try {
    const response = await axios.get(`${getBaseUrl(req)}/internal/books`);
    const allBooks = response.data;
    const matches = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].title.toLowerCase() === title)
      .map((isbn) => ({ isbn, ...allBooks[isbn] }));

    if (matches.length === 0) {
      return res.status(404).json({ message: `No books found with title "${req.params.title}"` });
    }
    return res.status(200).json(matches);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving books by title.', error: error.message });
  }
});

public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;