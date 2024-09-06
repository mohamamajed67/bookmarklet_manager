require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db('bookmarklets'); // Thay 'bookmarklets_db' bằng tên database của bạn
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}

connectToDatabase();

// API endpoints
app.get('/api/bookmarklets', async (req, res) => {
  try {
    const bookmarklets = await db.collection('bookmarklets').find().toArray();
    res.json(bookmarklets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookmarklets', async (req, res) => {
  const { name, description, code } = req.body;
  const newBookmarklet = { name, description, code, createdAt: new Date() };
  try {
    const result = await db.collection('bookmarklets').insertOne(newBookmarklet);
    res.status(201).json({ id: result.insertedId, ...newBookmarklet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookmarklets/:id', async (req, res) => {
  const { name, description, code } = req.body;
  const { id } = req.params;
  try {
    const result = await db.collection('bookmarklets').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description, code, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Bookmarklet not found' });
    } else {
      res.json({ id, name, description, code });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookmarklets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.collection('bookmarklets').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Bookmarklet not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});