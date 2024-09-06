const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db('bookmarklets');
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
    return false;
  }
}

// API endpoints
app.get('/api/bookmarklets', async (req, res) => {
  console.log('GET /api/bookmarklets request received');
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }
    const bookmarklets = await db.collection('bookmarklets').find().toArray();
    console.log(`Fetched ${bookmarklets.length} bookmarklets`);
    res.json(bookmarklets);
  } catch (error) {
    console.error('Error fetching bookmarklets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookmarklets', async (req, res) => {
  console.log('POST /api/bookmarklets request received');
  const { name, description, code } = req.body;
  const newBookmarklet = { name, description, code, createdAt: new Date() };
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }
    const result = await db.collection('bookmarklets').insertOne(newBookmarklet);
    console.log(`Inserted new bookmarklet with ID: ${result.insertedId}`);
    res.status(201).json({ id: result.insertedId, ...newBookmarklet });
  } catch (error) {
    console.error('Error creating bookmarklet:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookmarklets/:id', async (req, res) => {
  console.log(`PUT /api/bookmarklets/${req.params.id} request received`);
  const { name, description, code } = req.body;
  const { id } = req.params;
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }
    const result = await db.collection('bookmarklets').updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description, code, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      console.log(`Bookmarklet with ID ${id} not found`);
      res.status(404).json({ error: 'Bookmarklet not found' });
    } else {
      console.log(`Updated bookmarklet with ID: ${id}`);
      res.json({ id, name, description, code });
    }
  } catch (error) {
    console.error('Error updating bookmarklet:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookmarklets/:id', async (req, res) => {
  console.log(`DELETE /api/bookmarklets/${req.params.id} request received`);
  const { id } = req.params;
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }
    const result = await db.collection('bookmarklets').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      console.log(`Bookmarklet with ID ${id} not found`);
      res.status(404).json({ error: 'Bookmarklet not found' });
    } else {
      console.log(`Deleted bookmarklet with ID: ${id}`);
      res.status(204).send();
    }
  } catch (error) {
    console.error('Error deleting bookmarklet:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  console.log('GET /api/health request received');
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }
    await db.command({ ping: 1 });
    res.json({ status: 'OK', message: 'Connected to MongoDB' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
  const isConnected = await connectToDatabase();
  if (isConnected) {
    app.listen(port, () => {
      console.log(`Server đang chạy tại http://localhost:${port}`);
    });
  } else {
    console.error("Không thể kết nối đến database. Server không được khởi động.");
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});