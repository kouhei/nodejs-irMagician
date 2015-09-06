var color = require('../src/color'),
    fs = require('fs'),
    handler;

handler = function(req, res) {
  //リクエストされたURLをログに表示
  console.log(color.blue+'req: '+req.url+color.reset);

  //console.log('__dirname: '+__dirname);//デフォルトで用意された変数(curentDirectryのpathを返す)

  var head={'Content-Type':'text/html'};
  switch(req.url.slice(-3)){
    case '.js':head={'Content-Type':'text/javascript'};break;
    case 'css':head={'Content-Type':'text/css'};break;
    case 'png':head={'Content-Type':'image/png'};break;
    case 'jpg':head={'Content-Type':'image/jpeg'};break;
    case 'ico':head={'Content-Type':'image/x-icon'};break;
    case 'mp3':head={'Content-Type':'audio/mpeg'};break;
    case 'wav':head={'Content-Type':'audio/x-wav'};break;
      //case 'm4a':head={'Content-Type':'audio/mp4'};break;//.mp4
      //case 'ogg':head={'Content-Type':'audio/ogg'};break;
      //case 'ebm':head={'Content-Type':'video/webm'};break;
  }
  res.writeHead(200,head);
  if(req.url !=='/'){
    if(req.url === '/favicon.ico'){
      ;//何もしない
    }else{
      if(req.url === '/apple-touch-icon-precomposed.png'){
        ;
      }else{
        res.end(fs.readFileSync(__dirname + '/client' + req.url));
      }
    }
  }else{
    res.end(fs.readFileSync('../test/client/index.html'));
  }

};

module.exports = handler;
