const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối đến database
const db = new sqlite3.Database('./bookmarklets.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Khởi tạo bảng nếu chưa tồn tại
db.run(`CREATE TABLE IF NOT EXISTS bookmarklets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL
)`);

// API endpoints
app.get('/api/bookmarklets', (req, res) => {
  db.all("SELECT * FROM bookmarklets", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/bookmarklets', (req, res) => {
  const { name, description, code } = req.body;
  const id = Date.now().toString();
  db.run(`INSERT INTO bookmarklets (id, name, description, code) VALUES (?, ?, ?, ?)`,
    [id, name, description, code],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, name, description, code });
    }
  );
});

app.put('/api/bookmarklets/:id', (req, res) => {
  const { name, description, code } = req.body;
  const { id } = req.params;
  db.run(`UPDATE bookmarklets SET name = ?, description = ?, code = ? WHERE id = ?`,
      [name, description, code, id],
      function(err) {
          if (err) {
              res.status(500).json({ error: err.message });
              return;
          }
          if (this.changes === 0) {
              res.status(404).json({ error: 'Bookmarklet not found' });
          } else {
              res.json({ id, name, description, code });
          }
      }
  );
});

app.delete('/api/bookmarklets/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM bookmarklets WHERE id = ?`, id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Bookmarklet not found' });
    } else {
      res.status(204).send();
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});

// Đóng kết nối database khi tắt server
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});