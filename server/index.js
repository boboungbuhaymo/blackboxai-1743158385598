require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const { authenticateToken, checkRole } = require('./middleware/auth');
const userRoutes = require('./routes/users');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
const publicPath = path.join(__dirname, '../public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath, {
  dotfiles: 'ignore',
  index: false,
  extensions: ['html', 'css', 'js'],
  fallthrough: false
}));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve auth pages
app.get('/auth/:page', (req, res) => {
  const page = req.params.page;
  if (['login', 'register', 'forgot-password'].includes(page)) {
    res.sendFile(path.join(__dirname, `../public/auth/${page}.html`));
  } else {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, '../public/500.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`- POST /api/auth/register - Register new user`);
  console.log(`- POST /api/auth/login - User login`);
  console.log(`- GET /api/protected - Example protected route\n`);
});

module.exports = app;