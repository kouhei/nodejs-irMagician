# -*- coding: utf-8 -*-

import sys
import serial
import time
import json
import urllib2

ser = serial.Serial("/dev/ttyACM0", 9600, timeout = 1)
#ser = serial.Serial("/dev/tty.usb0121", 9600, timeout = 1)
ser.readline()

argvs = sys.argv
argc = len(argvs)
if (argc != 2):
    print 'Usage: # python %s filename' % argvs[0]
    quit()

    # f = open(argvs[1])
    f = urllib2.urlopen(argvs[1])

    json_data = json.load(f)
    f.close()

    recNumber = len(json_data['data'])
    rawX = json_data['data']


    ser.write("n,%d\r\n" % recNumber)
    ser.readline()

    postScale = json_data['postscale']
    ser.write("k,%d\r\n" % postScale)
    #time.sleep(1.0)
    ser.readline()

    for n in range(recNumber):
        bank = n / 64
        pos = n % 64
        if (pos == 0):
            ser.write("b,%d\r\n" % bank)

            ser.write("w,%d,%d\n\r" % (pos, rawX[n]))

            ser.write("p\r\n")
            ser.readline()

            ser.close()
