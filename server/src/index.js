require('dotenv').config(); // Nạp biến môi trường từ file .env (nếu có)

const express = require('express');
require('express-async-errors');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { closeDb } = require('./db/connection');
const { initSchema } = require('./db/schema');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const recruitmentRoutes = require('./routes/recruitment.routes');
const hrRoutes = require('./routes/hr.routes');
const rewardDisciplineRoutes = require('./routes/reward-discipline.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(uploadsDir));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/reward-discipline', rewardDisciplineRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BRAVO HRM REST API Server is running smoothly!',
    system: 'Công ty Cổ phần Phần mềm BRAVO',
    timestamp: new Date().toISOString()
  });
});

// 404 - Không khớp route nào ở trên
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`
  });
});

// Middleware bắt lỗi toàn cục - phải đặt SAU cùng, có 4 tham số (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi phía server.'
  });
});

// Initialize schema before accepting traffic. Run `npm run seed` explicitly when a
// deterministic local dataset is needed; startup must not reinsert the legacy fixture.
let server;
async function startServer() {
  await initSchema();
  server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 BRAVO HRM REST API Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Tắt server gọn gàng khi nhận Ctrl+C / lệnh kill
const shutdown = async () => {
  console.log('\n🛑 Đang tắt server...');
  await closeDb();
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
