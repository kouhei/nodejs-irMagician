/*
光センサで今ライトがついてるかついてないかを判断し、それでon、offを決める

コマンドライン引数として、メールの受信者のアドレス,メール送信者のアドレス,メール送信者のパスワードがいる
example: node yourGmailAddress@gmail.com subitterGmailAddress@gmail.com submitter'sPassword
NOTE:メールは両方ともgmailのみ可
*/

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
    IRMagician = require('../irMagician'),
    irMagician = {},

    SerialPort = require('serialport').SerialPort,
    arduino,

    doorSensor = 'on',//doorSensorの判定の有効、無効を切り替え
    lightJudge = function(){},//つけるか消すか

    Mailer = require('../src/mailer'),
    mailer,

    GetPost = require('../src/GetPost'),

    GetDate = require('../src/getDate'),
    getDate = new GetDate();


arduino = new SerialPort('/dev/ttyACM1');
irMagician = new IRMagician('/dev/ttyACM0');//arduinoと同時に繋いだ時

//mailerのユーザー名などが与えられた時
if(process.argv[2] && process.argv[3] && process.argv[4]){
  mailer = new Mailer(process.argv[2], process.argv[3], process.argv[4]);
  mailer.send('Starting doorHttp.js');
}else{
  console.log(color.error('mailer is not defined!'));
}

//onかoffかの判定
//bool : ONかOFF(optional) httpリクエストの文字列
lightJudge = function(bool){
  var dataName = '';
  if(!lightJudge.closeCount){
    lightJudge.closeCount = 0;
  }

  if(bool){
    lightJudge.closeCount++;
    if(bool === 'ON'){
      dataName = '../json/lightOn.json';
      if(lightJudge.closeCount % 2 !== 1){
        lightJudge.closeCount++;
      }
    }else{
      if(bool === 'OFF'){
        dataName = '../json/lightOff.json';
        if(lightJudge.closeCount % 2 !== 0){
          lightJudge.closeCount++;
        }
      }
    }
    irMagician.Lplay(dataName, function(){console.log('Lplay end callback');});
  }else{//doorSensorで判定
    if(doorSensor === 'on'){
      lightJudge.closeCount++;
      if(lightJudge.closeCount % 2 === 1){
        dataName = '../json/lightOn.json';
      }else{
        dataName = '../json/lightOff.json';
      }
      irMagician.Lplay(dataName, function(){console.log('Lplay end callback');});
    }else{
      console.log('doorSensor is sleeping');
    }
  }
};

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
        if (mailer) {
          if(doorSensor === 'on'){
            mailer.send('Door is opened.');
          }else{
            mailer.send('detecting an intruder.');
          }
        }
        lightJudge();
        break;
      case '\n':
      case '' : break;
      default:console.log(color.error('error'));
    }
  });

  arduino.on('close', function(){
    console.log(color.warning('arduino is closed'));
  });
});

//以下http
var httpServer = new GetPost();
var dp = {};

dp.post = function(data, res){
  var json = null;

  try{
    json = JSON.parse(data);
  }catch(err){
    console.log(color.error('error(onPostでtryJSON.parse): '+err));
  }
  if(json){
    if(json.request){
      switch(json.request){
        case 'lightON'    : lightJudge('OFF');break;
        case 'lightOFF'   : lightJudge('ON');break;
        case 'doorSleep'  : doorSensor = 'off';
        case 'doorWakeup' : doorSensor = 'on';
        default           : console.log('onPostData is '+data);
      }
    }
  }else{
    switch (data){
      case 'lightOFF': lightJudge('OFF');break;
      case 'lightON' : lightJudge('ON');break;
      default        : console.log('onPostData is '+data);
    }
    res.end(data);
  }
};


dp.get = function(req, res){
  switch (req.url){
    case '/on':
      lightJudge('ON');
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end('<h1>ON</h1>');
      break;
    case '/off':
      lightJudge('OFF');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>OFF</h1>');
      break;
    case '/sleep':
      doorSensor = 'off';
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>doorSleep</h1>');
      break;
    case '/wakeup':
      doorSensor = 'on';
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>doorWakeUp</h1>');
      break;
    default :
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>ON? OFF?</h1>');
      break;
  }
};

httpServer.createServer(dp);
httpServer.startServer(8080);
//TODO:メール送信しなくていい時の判定追加
//TODO:扉のセンサいるかいらないかの判定
