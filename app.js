const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors')
app.use(cors())
app.use(express.static('public'))

var rooms = 0;
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected',socket.id);
  socket.on('disconnect',()=>{
      console.log("disconnected",socket.id);
  })
  socket.on('new_game',()=>{
      socket.join('room-'+ ++rooms);
      var room_id = 'room-' + rooms;
      socket.emit('create_game',room_id);
  })
  socket.on('join_game',(player,room_id)=>{
     if(parseInt(room_id.split('-')[1])>rooms) socket.emit('err',"Room does not exists");
     else if(io.sockets.adapter.rooms.get(room_id).size==1){
        console.log(player);
        socket.join(room_id);
        io.sockets.in(room_id).emit("start_game",room_id);
     }
     else{
         socket.emit('err',"Room is full Sorry")
     }
  })
  socket.on("update_tile",(obj)=>{
      socket.broadcast.to(obj.room_id).emit("played_turn",obj);

  })
  socket.on("game_end",(message,room_id)=>{
      socket.broadcast.to(room_id).emit("end_game",message);
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
