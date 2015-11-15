var forever = require('forever-monitor');
var child = new (forever.Monitor)('./doorHttp.js', {
  max: 3,
  silent: false,
  args: []
});

child.on('exit', function () {
  console.log('your-filename.js has exited after 3 restarts');
});

child.start();
