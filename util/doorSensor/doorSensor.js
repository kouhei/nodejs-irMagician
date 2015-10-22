/*

コマンドライン引数として、メールの受信者のアドレス,メール送信者のアドレス,メール送信者のパスワードがいる
example: node yourGmailAddress@gmail.com subitterGmailAddress@gmail.com submitter'sPassword
NOTE:メールは両方ともgmailのみ可

*/

process.on('exit', function () {
  console.log('exit.');
});

var color = require('../../src/color'),
    IRMagician = require('../../irMagician'),
    irMagician = {},

    SerialPort = require('serialport').SerialPort,
    arduino,

    closeCount = 0,
    lightJudge = function(){},//つけるか消すか

    Mailer = require('../../src/mailer'),
    mailer,

    GetDate = require('../../src/getDate.js'),
    getDate = new GetDate(),

    doorSensor = require('../../src/doorSensor.js'),
    processings = [];

arduino = new SerialPort('/dev/ttyACM1');
irMagician = new IRMagician('/dev/ttyACM0');//MEMO:arduinoと同時に繋いだ時

processings[0] = function(data,lightJudge){
  switch(data){
    case '0\n' :
    case '0' : console.log(color.info('door is closed')); break;
    case '1\n' :
    case '1' :
      console.log(color.info('[' + getDate.getTime()+'] door is opened'));
      if (mailer) { mailer.send('Door is opened.'); }
      lightJudge();
      break;
    case '' : break;
    default:console.log(color.error('error'));
  }
};

if(process.argv[2] && process.argv[3] && process.argv[4]){
  mailer = new Mailer(process.argv[2], process.argv[3], process.argv[4]);
  mailer.send('Starting doorSensor.js');
}else{
  console.log(color.error('mailer is not defined!'));
}

doorSensor(irMagician, arduino, processings);
//FIXME:ドアの開け閉めだけで判定するとめんどい
//TODO:メール送信しなくていい時の判定追加
