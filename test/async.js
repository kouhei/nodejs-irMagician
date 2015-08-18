var async = require('async');
var a = [1,2,3,4,5,6,7,8,9,10];

var sent = "";
async.each(a, function(i, callback){
    // 処理1
    setTimeout(function() {
        sent += 'number ' + i + '\n';
        callback();
    }, 1000);

}, function(err){
    //処理2
    if(err) throw err;

    console.log(sent);
});
