var GetPost = function () {
  'use strict';
  this.server = {};
};

var pt = GetPost.prototype;

//prototype初期化処理(最初にやること)
GetPost.prototype = {
  http:require('http'),
  color:require('./color'),
};

//httpサーバーの定義
GetPost.prototype.createServer = function(DataProcesses){
  this.server = this.http.createServer(function (req, res) {
    var postProcess = DataProcesses.post;
    var getProcess  = DataProcesses.get;
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
          data += '';
          console.log('(getPost.js) postedData : ' + data);
          //ここまでお約束の前処理
          //ここがdataの本処理
          postProcess(data, res);//dataの処理
        });
        break;
      case 'GET':
        console.log('req: ' + req.url);
        getProcess(req, res);//データの処理
        break;
    }
  });
};

//httpサーバーを動かす
GetPost.prototype.startServer = function(port){
  port = port || 8080;
  this.server.listen(port);
  console.log(this.color.info('http listen at '+port));
};



module.exports = GetPost;

/*/以下example
var lightJudge = function(bool){
  console.log(bool);
};
var httpServer = new GetPost();

var dp = {};

dp.post = function(data, res){
  switch (data){
    case 'lightOFF': lightJudge('OFF');break;
    case 'lightON' : lightJudge('ON');break;
    default        : console.log('(newGetPost.js) onPostData is '+data);
  }
  res.end(data);
};

dp.get = function(req, res){
  if(req.url === '/on'){
    lightJudge('ON');
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end('<h1>ON</h1>');
  } else {
    if(req.url === '/off'){
      lightJudge('OFF');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>OFF</h1>');
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<h1>ON? OFF?</h1>');
    }
  }
};

httpServer.createServer(dp);
httpServer.startServer(8080);
//*/
