var SerialPort = require('serialport').SerialPort;

//var irMagician = new SerialPort("/dev/tty.usbmodem0121", { baudrate: 9600 });
var irMagician = new SerialPort("/dev/ttyACM0", { baudrate: 9600 });

irMagician.on("open", function () {
    console.log('open');
    irMagician.on('data', function(data) {
        console.log('data received: ' + data);
    });

    irMagician.write("C\n", function(err, results) {
    	if(err){
    		console.log('err ' + err);
    	}
        	console.log('results ' + results);
    });
    
});
