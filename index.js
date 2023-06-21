const express = require('express');
const { Client } = require('replit-storage');
const Database = require('@replit/database');
const cors = require('cors');

const client = new Client();
const db = new Database(process.env.REPLIT_DB_URL); // Pass the REPLIT_DB_URL to the Database constructor
const app = express();

const { WORDNIK_API_KEY } = process.env;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Add a leaderboard entry
app.post('/leaderboard', async (req, res) => {
  try {
    const { name, score, time } = req.body;

    // Validate the request data
    if (!name || !score || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a unique key for the entry
    const entryId = generateEntryId();

    // Store the entry in the database with the current date
    const currentDate = getCurrentDate();
    await db.set(entryId, { name, score, time, date: currentDate });

    return res.status(201).json({ message: 'Leaderboard entry added successfully' });
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    return res.status(500).json({ message: 'Failed to add leaderboard entry' });
  }
});

// Get leaderboard entries for the current date
app.get('/leaderboard', async (req, res) => {
  try {
    // Get all keys in the database
    const keys = await db.list();

    // Filter keys for the current date
    const currentDate = getCurrentDate();
    const filteredKeys = keys.filter((key) => {
      const entry = await db.get(key);
      return entry.date === currentDate;
    });

    // Retrieve the entries for each key
    const entries = await Promise.all(filteredKeys.map(async (key) => {
      const entry = await db.get(key);
      return entry;
    }));

    // Sort the entries by score in descending order
    const sortedEntries = entries.sort((a, b) => b.score - a.score);

    return res.status(200).json(sortedEntries);
  } catch (error) {
    console.error('Error retrieving leaderboard entries:', error);
    return res.status(500).json({ message: 'Failed to retrieve leaderboard entries' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Generate a unique entry ID
function generateEntryId() {
  return Date.now().toString();
}

// Get the current date in the format YYYY-MM-DD
function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
