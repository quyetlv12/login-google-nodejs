// Import the necessary packages
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cookieSession = require('cookie-session');
const dotenv = require('dotenv');

// Load environment variables from a .env file
dotenv.config();

// Create an instance of the Express web framework
const app = express();

// Set up cookie session middleware
app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE_SECRET],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Create an instance of the Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Create a route for handling the Google login callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { tokens } = await client.getToken(req.query.code);
    client.setCredentials(tokens);

    // Get the user's Google profile information
    const { data: { email, name } } = await client.request({
      url: 'https://www.googleapis.com/userinfo/v2/me',
    });

    // Store the user's data in the session
    req.session.email = email;
    req.session.name = name;

    // Redirect the user to the home page
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Create a route for handling the login request
app.get('/auth/google', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    redirect_uri: redirectUri,
  });

  // Redirect the user to the Google Sign-In page
  res.redirect(authUrl);
});

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening on port ${process.env.PORT || 3000}`);
});
