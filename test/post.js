var fs = require('fs'),
    color = require('../src/color'),
    http = require('http'),
    server = {},
    IRMagician = require('../irMagician'),
    irMagician = {},
    port = '',

    SerialPort = require('serialport').SerialPort,
    arduino = {};

//TODO:arduinoを繋げてるか繋げてないか確認 => /dev/ttyACM1があるかどうか

irMagician = new IRMagician('/dev/ttyACM1');//arduinoと同時に繋いだ時   //FIXME:try,catchでやってもerrをキャッチできない

try{
    arduino = new SerialPort('/dev/ttyACM0');
}catch(err){
    throw err;
}

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
            res.writeHead(200,{'Content-Type':'text/html'});
            res.end(fs.readFileSync('./client/index-post.html'));
            break;
    }
});
port = 8080;
server.listen(port);
console.log('lidten at '+port);



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

function now(){
    var getTime = new Date(),
        month = getTime.getMonth()+1,
        date = getTime.getDate(),
        hours = getTime.getHours(),
        minutes = getTime.getMinutes(),
        seconds = getTime.getSeconds();
    return dateFormatter([month,date,hours,minutes,seconds]);
}


function onPost(data){
    switch (data+''){
        case 'lightOFF': send('OFF');break;//dataIsOFF();break;
        case 'lightON' : send('ON');break;//dataIsON();break;
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
    word = 'OFF';
    playDataName = '../json/lightOff.json';
  }

  console.log(color.safe('<'+now()+'> light'+word));
  irMagician.Lplay(playDataName, function(){console.log('Lplay end callback');});
}
