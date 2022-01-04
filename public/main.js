var socket = io(),player_details,game_details;

class Player{
    constructor(username,player_id,box_type){
      this.name = username;
      this.id = player_id;
      this.type = box_type;
      this.yourTurn = true;
      this.moves = 0;
      this.getUsername = this.getUsername.bind(this);
      this.updateMovesPlayed = this.updateMovesPlayed.bind(this);
      this.getType = this.getType.bind(this);
      this.setYourTurn = this.setYourTurn.bind(this);
      this.setMoves = this.setMoves.bind(this);
      this.getYourTurn = this.getYourTurn.bind(this);
      this.getMoves = this.getMoves.bind(this);
    }
    updateMovesPlayed = (box_value) => this.moves+=box_value;
    getUsername = () => this.name;
    getType = () => this.type; 
    getYourTurn = ()=> this.yourTurn;
    setMoves = (num) =>{this.moves+=num};
    setYourTurn = ()=>{this.yourTurn = !this.yourTurn};
    getMoves = () => this.moves;
}

class Tic_Tac_Toe{
  constructor(id){
    this.winPossibility = [7,56,84,73,146,273,292,448];
    this.room_id = id;
    this.total_moves = 0;
    this.create_board = this.create_board.bind(this);
    this.getRoomId = this.getRoomId.bind(this);
    this.isGameEnded = this.isGameEnded.bind(this);
  }
  getRoomId = () => this.room_id;

  isGameEnded = () =>{
    // if the player's moves bits matches any one of the possibilites
    var check_list = this.winPossibility.filter((possibility)=>(player_details.getMoves() & possibility)=== possibility)

    if (check_list.length){ // if any possibility's bits are all set to the player_moves.
      socket.emit("game_end",`${player_details.getUsername()} has won`,game_details.getRoomId());
      alert("You won\n Congratulations")
    }
    // in cases all tiles are filled
    else if(this.total_moves===9) socket.emit("game_end","The Match is Tied",game_details.getRoomId());
  }

  create_board= () => {
      // create the board 
      var table = document.createElement('table')  
      table.classList.add('board');

      // create the 9 tiles
      for(var i=1;i<=3;i++){
        for(var j=1;j<=3;j++){
            var tile = document.createElement('button');
            tile.setAttribute('class',`${i}${j}`);
            tile.style.backgroundColor = "#e7e7e7";
            tile.style.color = "black";
            tile.style.margin = "2px";
            tile.style.padding = "40px";
            table.appendChild(tile);

            // event listener is created for every tile.
            tile.addEventListener('click',(e)=>{
              console.log(e)
              // checks if the player's turn when it is clicked

              if(player_details.getYourTurn() === false) alert("Its not ur turn");

              // if the tile is already filled 
              else if(e.target.innerText!=="") alert("This is already filled");

              // filling the tile with relevant player_tile and notify 
              // the server to update tile
              else{

                  var tile_no = parseInt(e.target.getAttribute("class"));
                  
                  e.target.innerText= player_details.getType();
                  var row = parseInt(tile_no/10),col = tile_no%10;

                  // game logic is here.
                  // every tile is considered as a bit of the number in its binary form.
                  // eg : when player chooses tile 3  the 3rd bit is set 100(8) which is added to his moves
                  // there are 9 possibilites where player can win when every move is played. 
                  // [7,56,84,73,146,273,292,448]
                  // 7 = 0 0 0 0 0 0 1 1 1 - when tile1-tile2-tile3 is choosed 
                  // 56= 0 0 0 1 1 1 0 0 0 - when tile4-tile5-tile6 is choosed
                  //similarly there are 9 numbers for 9 possibilites to win
                  player_details.setMoves(1<<(3*(row-1)+col-1));

                  console.log(1<<(3*(row-1)+col-1),player_details.getMoves()); 

                  player_details.setYourTurn(); // setting the player's turn to false

                  document.getElementsByClassName('turn')[0].innerHTML = player_details.getYourTurn() ? "Its your turn" : "Its other player's turn"
                  
                  // emitting event to server so that server can notify the other player to update the tile.
                  socket.emit("update_tile",{tile_no : e.target.getAttribute("class"),room_id : game_details.getRoomId(),type:player_details.getType()});

                  // checking if the game ended.
                  game_details.isGameEnded();
              }
            })
        }
        table.appendChild(document.createElement('br'))
      }
      return table;
    }

}

function new_game(){
  username =document.querySelector('.name').value;
  player_details = new Player(username,socket.id,'O');
  socket.emit('new_game');
  return;
}
function join_game(){
  var username =document.querySelector('.name1').value;
  var id =document.querySelector('.room_id').value;
  player_details = new Player(username,socket.id,'X');
  player_details.setYourTurn();
  socket.emit('join_game',player_details,id);
  return;
}

function create_node(type,text){
  node = document.createElement(type);
  node.appendChild(document.createTextNode(text));
  return node ;
}

socket.on('create_game',function (id){
  document.querySelector('.game_start').style.display = "none";
  var node = document.createElement("div");
  node.classList.add("player1");               
  var hello = create_node('h1',`Hello ${player_details.getUsername()}`);      
  var message = create_node('h1',`The room_id is ${id}`); 
  var message1 = create_node('h1',"Waiting For player2 to join"); 
  node.append(hello,message,message1);
  document.querySelector(".App").appendChild(node);                          
})

socket.on("start_game",(room_id)=>{
  game_details = new Tic_Tac_Toe(room_id);
  if(player_details.getType() === 'O') document.querySelector('.player1').style.display = "none";
  else document.querySelector('.game_start').style.display = "none";
  msg = create_node('h3',player_details.getYourTurn() ? "Its your turn" : "Its other player's turn");
  msg.classList.add("turn")
  board_html = game_details.create_board();
  document.querySelector(".game_screen").append(msg,document.createElement('br'),board_html);
})

socket.on("played_turn",(obj)=>{
  document.getElementsByClassName(obj.tile_no)[0].innerText= obj.type;
  player_details.setYourTurn();
  document.getElementsByClassName('turn')[0].innerHTML = player_details.getYourTurn() ? "Its your turn" : "Its other player's turn"
})

socket.on("end_game",(message)=>{
  alert(message);
})
socket.on('err',(data)=>{
  alert(data);
})