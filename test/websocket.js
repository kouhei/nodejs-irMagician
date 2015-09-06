//emitいろいろ
/*---------------------------------------------------------------
socket.emit("publish",{value:msg});//送信者へ返信
socket.broadcast.emit("publish",{value:msg});//送信者以外に送信
io.sockets.emit("publish", {value: msg});//全部に送信
 ----------------------------------------------------------------
送信者のsocketのidを取得する
    socket.id

専用のroomに入る
    socket.join(room_id);

指定したsocket_idに送る
    io.sockets.socket(socket_id).emit('event_name',{name:"hoge"});

room内全員に送信する
    io.sockets.in(room_id).emit('event_name',{name:"hoge"});

disconnectしないで、roomから消える
(disconnectが走れば、自動的にこれが走るが、disconnectしないでもroomから消えるには)
    socket.leave(room_id);
*/

var fs = require('fs'),
    color = require('../src/color'),
    setting = require('../src/setting'),
    IRMagician = require('../irMagician'),
    sockets,
    server,
    port,
    io,
    irMagician,

    SerialPort = require('serialport').SerialPort,
    arduino,
    aData,

    activeCount = 0;


function dateFormatter(array){
  var res = '';
  if(array.length !== 5){
    throw 'dateFormatterの引数がまちがっている';
  }
  for(var i=0;i<array.length;i++){
    if(array[i] < 10){
      array[i] = '0'+array[i];
    }
  }
  res = array[0]+'/'+array[1]+' '+array[2]+':'+array[3]+':'+array[4];
  return res;
}

function now(){
  var getTime = new Date(),
      month = getTime.getMonth()+1,
      date = getTime.getDate(),
      hours = getTime.getHours(),
      minutes = getTime.getMinutes(),
      seconds = getTime.getSeconds();
  return dateFormatter([month,date,hours,minutes,seconds]);
}

irMagician = new IRMagician('/dev/ttyACM1');//arduinoと同時に繋いだ時
try{
  arduino = new SerialPort('/dev/ttyACM0');
}catch(err){
  throw err;
}



port = 2056;
//http
server = require('http').createServer(setting),
server.listen(port);
console.log('listen at ' + port);

io = require('socket.io')(server);
sockets = io.sockets.sockets;

io.sockets.on('connection', function (socket) {
  ++activeCount;
  console.log('webSocket connect');

  socket.on('lightOFF', function () {
    console.log(color.safe('<'+now()+'> lightOFF'));
    socket.broadcast.emit('lightOFF');
    irMagician.Lplay('../json/lightOff.json', function(){console.log('Lplay end callback');io.sockets.emit('finished');});
  });

  socket.on('lightON', function () {
    console.log(color.safe('<'+now()+'> lightON'));
    socket.broadcast.emit('lightON');
    irMagician.Lplay('../json/lightOn.json', function(){console.log('Lplay end callback');io.sockets.emit('finished');});
  });

  socket.on('disconnect', function(){
    console.log(color.warning('webSocket disconnect'));
    --activeCount;
  });

});



arduino.on('open', function(){
  console.log('arduino opened');

  arduino.on('close', function(){
    console.log(color.warning('arduino closed'));
  });

  arduino.on('data', function(data){
    //console.log('<data>' + data + '</data>');
    aData += data + '';
    /*setTimeout(function () {
            console.log('arduino : ' + aData + '\n');
            aData = '';
        },2900);*/
  });
});
//FIXME:時々押しても(でーたを送っても)反応しなくなる
