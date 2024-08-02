require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());
const PORT = 9999;
const UserController = require("./controller/user.controller")
const MessageController = require("./controller/msg.controller")
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
const server = http.createServer(app);
const cors = require('cors');
const upload = require('./middleware/multer');
const { createLink, getAllLinks, getLinkById, updateLink, deleteLink } = require('./controller/links.controller');
const Links = require('./models/Links');

// const { createClient } = require('redis');

// // TEST REDIS
// const client = createClient({
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: 'redis-19685.c61.us-east-1-3.ec2.redns.redis-cloud.com',
//         port: 19685
//     }
// });
// client.connect(console.log("Connect To Reddis")).catch(console.error);


app.use(cors());
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log(`A user connected with id: ${socket.id}.`);


  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  socket.on('updateMessage', (data) => {
    io.emit('receiveUpdatedMessage', data);
  });

  socket.on('deleteMessage', (id) => {
    io.emit('receiveDeletedMessage', id);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log(`Connect to Mongodb Atlas`);
  })
  .catch(err => {
    console.error(err);
  });


// User Routes
app.get('/users', UserController.getUsers);
app.get('/users/:id', UserController.getUserById);
app.get('/usersE/:email', UserController.getUserByEmail);
app.get('/user/:username', UserController.getUserByFullname);
app.post('/users', UserController.createUser);
app.put('/users/:id', upload.single('urlimage'),UserController.updateUserById);
app.put('/usersE/:email', UserController.updateUserByEmail);
app.delete('/users/:id', UserController.deleteUserById);

// Message routes
app.get('/messages', MessageController.getMessages);
app.get('/messages/:id', MessageController.getMessageById);
app.post('/messages', MessageController.createMessage);
app.put('/messages/:id', MessageController.updateMessageById);
app.delete('/messages/:id', MessageController.deleteMessageById);
app.delete('/messages', MessageController.deleteAllMessages);

// Links route 
app.get('/links', getAllLinks);
app.get('/links/:id', getLinkById);
app.post('/links', createLink);
app.put('/links/:id', updateLink);
app.delete('/links/:id', deleteLink);

app.delete("/d", async (req, res) => {
  try {
    const result = await Links.deleteMany({});
    res.status(200).json({ message: "All links have been deleted.", result });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while deleting links.", error });
  }
});
