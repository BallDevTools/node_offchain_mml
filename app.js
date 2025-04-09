require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const methodOverride = require('method-override');

// Import routes
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Import services
const notificationService = require('./services/notification-service');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "cdn.ethers.io"],
      connectSrc: ["'self'", "wss://*", "https://*"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://*"],
    },
  },
}));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'crypto-membership-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (room) => {
    console.log(`Client ${socket.id} joined room: ${room}`);
    socket.join(room);
  });

  socket.on('unsubscribe', (room) => {
    console.log(`Client ${socket.id} left room: ${room}`);
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize notification service with Socket.io
notificationService.init(io);

// Routes
app.use('/', indexRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };