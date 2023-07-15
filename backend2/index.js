const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Add the Permissions-Policy header middleware
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'ch-ua-form-factor');
  next();
});

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://alinaghani13:herwob-pewcak-qytKi8@cluster0.z7tc2lc.mongodb.net/mail_service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define a schema for the inscription
const inscriptionSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// Create a model from the schema
const Inscription = mongoose.model('Inscription', inscriptionSchema);

// API endpoint for saving inscription form data
app.post('/api/inscriptions', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Create a new inscription instance
    const inscription = new Inscription({ name, email, password });

    // Save the inscription to the database
    await inscription.save();

    res.status(201).json({ status: 'success', inscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint for the webhook
app.post('/api/webhook', (req, res) => {
  const { from, to, subject, message } = req.body;

  // Process the webhook data as desired (e.g., save it to the database)
  // ...

  res.status(200).json({ status: 'success' });
});

// Google authentication setup
const credentials = {
  client_id: '935153154949-h2cv9ffvaqme92skvdppq8s92t3qai7t.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: ['http://localhost:3001/api/google-login/callback']
};

const oAuth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

// Authorize access to Google Calendar
function authorize(callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  });

  callback(authUrl);
}

// Get upcoming events from user's Google Calendar
function getUpcomingEvents(accessToken, callback) {
  oAuth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calendar.events.list(
    {
      calendarId: 'primary',
      timeMin: today.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    },
    (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      const events = res.data.items;
      callback(events);
    }
  );
}

// Route for Google authentication
app.get('/api/google-login', (req, res) => {
  authorize(authUrl => {
    res.redirect(authUrl);
  });
});

// Callback after Google authentication
app.get('/api/google-login/callback', (req, res) => {
  const { code } = req.query;

  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Error retrieving access token', err);
      res.status(500).json({ error: 'Failed to retrieve access token' });
      return;
    }

    const { access_token } = token;

    getUpcomingEvents(access_token, events => {
      res.json(events);
    });
  });
});

const PORT = 3002;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
