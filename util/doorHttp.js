/*

コマンドライン引数として、メールの受信者のアドレス,メール送信者のアドレス,メール送信者のパスワードがいる
example: node yourGmailAddress@gmail.com subitterGmailAddress@gmail.com submitter'sPassword
NOTE:メールは両方ともgmailのみ可

*/

process.on('exit', function () {
  console.log('exit.');
});

var fs = require('fs'),
    color = require('../src/color'),
    //http = require('http'),
    //server = {},
    IRMagician = require('../irMagician'),
    irMagician = {},
    port = '',

    SerialPort = require('serialport').SerialPort,
    arduino,

    closeCount = 0,
    lightJudge = function(){},//つけるか消すか

    Mailer = require('../src/mailer'),
    mailer,
    mailerPass,

    GetDate = require('../src/getDate.js'),
    getDate = new GetDate();


arduino = new SerialPort('/dev/ttyACM0');
irMagician = new IRMagician('/dev/ttyACM1');//MEMO:arduinoと同時に繋いだ時

if(process.argv[2] && process.argv[3] && process.argv[4]){
  mailer = new Mailer(process.argv[2], process.argv[3], process.argv[4]);
  mailer.send('doorSensor.jsが起動しました');
}else{
  console.log(color.error('mailer is not defined!'));
}


lightJudge = function(){
  var dataName = '';
  if(!lightJudge.closeCount){
    lightJudge.closeCount = 0;
  }
  lightJudge.closeCount++;
  //console.log('count' + lightJudge.closeCount);
  if(lightJudge.closeCount % 2 === 1){
    dataName = '../json/lightOn.json';
  }else{
    dataName = '../json/lightOff.json';
  }
  irMagician.Lplay(dataName, function(){console.log('Lplay end callback');});
};
//lightJudge.closeCount = 0;

arduino.on('open', function(){
    console.log(color.info('arduino is opened'));

    arduino.on('data', function(data){
        console.log('<data>' + data + '</data>');
        data += '';//Object => String
        switch(data){
          case '0\n' :
          case '0' : console.log(color.info('door is closed')); break;
          case '1\n' :
          case '1' :
            console.log(color.info('[' + getDate.getTime()+'] door is opened'));
            if (mailer) { mailer.send('ドアが開きました'); }
            lightJudge();
            break;
          case '' : break;
          default:console.log(color.error('error'));
        }
    });

    arduino.on('close', function(){
        console.log(color.warning('arduino is closed'));
    });
});
//TODO:メール送信しなくていい時の判定追加



var http = require('http'),
  server = {};

server = http.createServer(function(req, res){
  switch (req.method){
    case 'POST':
      var data = '';
      res.writeHead(200,{'Access-Control-Allow-Origin':"*"});
      req.setEncoding('utf8');
      req.on('data', function(dataChunk) {
        // データ受信中の処理
        data += dataChunk;
      });
      req.on('end', function() {
        // データ受信完了後の処理
        console.log('posted data : ' + data);
        onPost(data);//dataの処理
        res.end(data+'');
      });
      break;

    case 'GET':
      console.log('req: '+req.url);
      if(req.url === '/on'){
        send('ON');
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end('<h1>ON</h1>');
        break;
      }else{
        if(req.url === '/off'){
          send('OFF');
          res.writeHead(200,{'Content-Type':'text/html'});
          res.end('<h1>OFF</h1>');
          break;
        }else{
          res.writeHead(200,{'Content-Type':'text/html'});
          res.end('<h1>ON? OFF?</h1>');
          break;
        }
      }
  }
});
port = 8080;
server.listen(port);
console.log('lidten at '+port);

function onPost(data){
  switch (data+''){
    case 'lightOFF': send('OFF');break;
    case 'lightON' : send('ON');break;
    default        : console.log('data is '+data);
  }
}

function send(judge){
  var word = '',
      playDataName = '';

  if(judge==='ON'){
    word = judge;
    playDataName = '../json/lightOn.json';
  }else{
    if(judge==='OFF'){
      word = 'OFF';
      playDataName = '../json/lightOff.json';
    }
  }

  console.log(color.safe('<'+now()+'> light'+word));
  irMagician.Lplay(playDataName, function(){console.log('Lplay end callback');});
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

function dateFormatter(array){
  var res = '';
  if(array.length !== 5){
    throw 'dateFormatterの引数がまちがってる';
  }
  for(var i=0;i<array.length;i++){
    if(array[i] < 10){
      array[i] = '0'+array[i];
    }
  }
  res = array[0]+'/'+array[1]+' '+array[2]+':'+array[3]+':'+array[4];
  return res;
}
//FIXME:lightOffの時だけ応答ない時あり
