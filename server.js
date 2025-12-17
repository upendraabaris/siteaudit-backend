const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const auditRoutes = require('./routes/audit');
const seoRoutes = require('./routes/seo');
const performanceRoutes = require('./routes/performance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/audit', auditRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/performance', performanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Website Audit Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Website Audit Backend API ready!`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});