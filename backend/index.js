const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add the Permissions-Policy header middleware
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'ch-ua-platform=*, ch-ua-platform-version=*, ch-ua-model=*, ch-ua-mobile=*');

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

// Middleware express-session
app.use(
  session({
    secret: 'votre_secret_key',
    resave: false,
    saveUninitialized: false
  })
);

// Initialisation de Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Sérialisation et désérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google authentication strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: '935153154949-h2cv9ffvaqme92skvdppq8s92t3qai7t.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:3001/api/google-login/callback',
      scope: ['profile', 'email']
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      // Gérer les informations du profil utilisateur ici
      // Sauvegarder les informations dans la base de données si nécessaire
      // Appeler la fonction `done` avec les informations du profil utilisateur
      done(null, profile);
    }
  )
);

// Route for Google authentication
app.get('/api/google-login', passport.authenticate('google'));

// Callback after Google authentication
app.get(
  '/api/google-login/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Rediriger vers la page d'inscription sur le frontend
    res.redirect('http://localhost:8080/chat');
  }
);

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

// Serve the chat.html file
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Événement de réception de message
  socket.on('message', (data) => {
    console.log('Message received:', data);
    // Envoyer le message à tous les clients connectés (broadcast)
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3001;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
