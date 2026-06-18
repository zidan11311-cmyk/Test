require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { getDb } = require('./db/database');
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feeds');
const briefRoutes = require('./routes/brief');
const assetRoutes = require('./routes/assets');
const actionRoutes = require('./routes/actions');
const findingRoutes = require('./routes/findings');
const watchlistRoutes = require('./routes/watchlist');
const { verifyJwt } = require('./middleware/auth');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Ensure DB is initialized on startup
getDb();

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/feeds', verifyJwt, feedRoutes);
app.use('/api/briefs', verifyJwt, briefRoutes);
app.use('/api/assets', verifyJwt, assetRoutes);
app.use('/api/actions', verifyJwt, actionRoutes);
app.use('/api/findings', verifyJwt, findingRoutes);
app.use('/api/watchlist', verifyJwt, watchlistRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve frontend static build in production
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) res.status(200).send('<p>Frontend not built. Run: cd frontend && npm run build</p>');
  });
});

startScheduler();

app.listen(PORT, () => {
  console.log(`AIB Sentinel backend running on port ${PORT}`);
});
