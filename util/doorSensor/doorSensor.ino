void setup(){
    Serial.begin(9600);
    //pinMode(13, OUTPUT);
    pinMode(2, INPUT_PULLUP);
    //digitalWrite(13, 1);
}

int lastSwitchVal = 0;
//int lastButtonVal = 0;

int doorCount = 0;
//int judge = 1;//on:1,off:0

void loop() {
    int switchVal;//doorSensor
    /*int buttonVal;

    buttonVal = digitalRead(4);
    if(buttonVal == 1 && buttonVal != lastButtonVal){
        if(doorCount%2 == 0){
            judge = 1;
            digitalWrite(13, 1);
        }else{
            judge = 0;
            digitalWrite(13, 0);
        }
        doorCount++;
    }
    lastButtonVal = buttonVal;*/

    switchVal = digitalRead(2);
    //if(judge == 1){
        if (switchVal != lastSwitchVal){
            if (switchVal == 0){//ドアが閉まった
                Serial.print("0\n");
            }
            else {//ドアが開いた
                Serial.print("1\n");
            }
        }
    //}
    lastSwitchVal = switchVal;

    Serial.flush();
    delay(10);
}