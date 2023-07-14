const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://alinaghani13:herwob-pewcak-qytKi8@cluster0.z7tc2lc.mongodb.net/mail_service', { useNewUrlParser: true, useUnifiedTopology: true })
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

const PORT = 3002;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
