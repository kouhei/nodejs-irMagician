# -*- coding: utf-8 -*-

import sys
import serial
import time
import json

rawX = []

#ser = serial.Serial("/dev/ttyACM0", 9600, timeout = 1)
ser = serial.Serial("/dev/tty.usbmodem0121", 9600, timeout = 1)
ser.readline()

argvs = sys.argv
argc = len(argvs)
if (argc != 2):
	print 'Usage: # python %s filename' % argvs[0]
	quit()
print argvs[1]
f = open(argvs[1], 'w')


ser.write("I,1\r\n")#赤外線信号の変化点 (L/Hの切り替わり)の数
time.sleep(1.0)
recNumberStr = ser.readline()
recNumber = int(recNumberStr, 16)#recNumberStrを16進数の数字と認識して、10進数の数字に変換した値を返す

ser.write("I,6\r\n")#postScalerの値
time.sleep(1.0)
postScaleStr = ser.readline()
postScale = int(postScaleStr, 10)#postScaleStrを10進数の数字と認識して、10進数の数字に変換した値を返す


#for n in range(640):
for n in range(recNumber):
    bank = n / 64
    pos = n % 64
    if (pos == 0):
        ser.write("b,%d\r\n" % bank)#メモリのバンクを0~9の整数の値で指定  #メモリのバンク設定を行います。0~9まで

    ser.write("d,%d\n\r" % pos)#メモリの表示(16進数) 0~63
    xStr = ser.read(3)#3文字読み込み
    xData = int(xStr, 16)#xStrを16進数の数字と認識して、10進数の数字に変換した値を返す
    rawX.append(xData)#xDataをrawX(リスト型)の最後に追加する

json_data = {'format':'raw', 'freq':38, 'data':rawX, 'postscale':postScale}
json.dump(json_data, f)

f.close()

ser.close()