/*
irMagician : (必ず必要)
lightJudge : 信号を送信する関数(必ず必要)
port : defaultは8080

*/
var getPost = function (irMagician, lightJudge, port) {
  'use strict';
  var color = require('./color'),
    GetDate = require('./getDate.js'),
    getDate,
    http = require('http'),
    server = {};

  port = port || 8080;
  if (!irMagician) {
    throw color.error('irMagician is undefined');
  }

  getDate = new GetDate();

  server = http.createServer(function (req, res) {
    switch (req.method) {
      case 'POST':
        var data = '';
        res.writeHead(200, {'Access-Control-Allow-Origin': "*"});
        req.setEncoding('utf8');
        req.on('data', function (dataChunk) {
          // データ受信中の処理
          data += dataChunk;
        });
        req.on('end', function () {
          // データ受信完了後の処理
          console.log('(getPost.js) posted data : ' + data);
          onPost(data);//dataの処理
          res.end(data + '');
        });
        break;

      case 'GET':
        console.log('req: ' + req.url);
        if(req.url === '/on'){
          lightJudge('ON');
          //send('ON');
          res.writeHead(200, {'Content-Type':'text/html'});
          res.end('<h1>ON</h1>');
          break;
        } else {
          if(req.url === '/off'){
            lightJudge('OFF');
            //send('OFF');
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('<h1>OFF</h1>');
            break;
          } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('<h1>ON? OFF?</h1>');
            break;
          }
        }
    }
  });
  server.listen(port);
  console.log(color.info('http lidten at '+port));

  function onPost(data){
    switch (data+''){
      case 'lightOFF': lightJudge('OFF');break;
      case 'lightON' : lightJudge('ON');break;
      default        : console.log('(getPost.js) onPostData is '+data);
    }
  }

  /*function send(judge){
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

    console.log(color.safe('<' + getDate.getTime() + '> light' + word));
    irMagician.Lplay(playDataName, function(){console.log('(getPost.js) Lplay end callback');});
  }*/

};

module.exports = getPost;
