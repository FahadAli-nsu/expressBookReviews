const express = require('express');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use(
  '/customer',
  session({
    secret: 'fingerprint_customer',
    resave: true,
    saveUninitialized: true,
  })
);

// Middleware to verify JWT for any /customer/auth/* route
app.use('/customer/auth/*', function auth(req, res, next) {
  if (req.session.authorization) {
    next();
  } else {
    return res.status(403).json({ message: 'User not logged in.' });
  }
});

const PORT = 5001;

app.use('/customer', customer_routes);
app.use('/', genl_routes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));