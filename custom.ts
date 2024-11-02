enum MotorSetup{
    //% block="ordered"
    Ordered = 0,
    //% block="reversed"
    Reversed = 1
}

enum MotorSetupMode {
    Direct,
    Sevro
}


/**
 * Custom blocks
 */
//% weight=10 color=#333333 icon="\uf2db" block="Control Car" blockId="controlCar"
namespace controlCar {

    let straightPressed = 0

    let veloTargetR = 0.0
    let veloTargetL = 0.0
    let veloMultiplierR = 1.0
    let veloMultiplierL = 1.0
    let fullSpeed = 0.0
    let speedLimit = 100.0

    let pureRotationRate = 0.3
    let mixedRotationRate = 0.2

    let motorSetupMode = MotorSetupMode.Direct;
    let dt = 0.0
    let timeCurrent = 0.0
    let timeLast = 0.0
    let veloR = 0.0
    let veloL = 0.0
    let accelerationTime = 50
    let invAccelerationTime = 1.0 / accelerationTime

    let inControl = false

    /**
     * @param speedLimit_ is the highest rotational speed of motors
     * @param pureRotationRate_ is the speed of motors (as a rate of highest speed) used for pure rotation
     * @param mixedRotationRate_ is the speed of motors (as a rate of highest speed) used for mixed rotation
     * @param accelerationTime_ is the rate of current RPM convergening to terget RPM
     * @param motorSetup_ is Reversed, when motor1 and motor2 corresponse to wheel_right and wheel_left, otherwise 0
     */
    //% block="car servo control || with maxRPM $speedLimit_|PRR $pureRotationRate_|MRR $mixedRotationRate_|acceleration time $accelerationTime_|and $motorSetup_|motor setup"
    //% speedLimit_.min=20.0 speedLimit_.max=100.0
    //% speedLimit_.defl=100.0
    //% pureRotationRate_.min=0.0 pureRotationRate_.max=1.0
    //% pureRotationRate_.defl=0.3
    //% mixedRotationRate_.min=0.0 mixedRotationRate_.max=0.6
    //% mixedRotationRate_.defl=0.2
    //% accelerationTime_.min=20 accelerationTime_.max=1000
    //% accelerationTime_.defl=0
    //% accelerationTime_.shadow=timePicker
    //% expendableArgumentMode="toggle"
    //% motorSetup_.defl=MotorSetup.Reversed
    //% weight=50
    //% inlineInputMode=inline
    export function carServoSpeed(speedLimit_: number, pureRotationRate_: number, mixedRotationRate_: number,
        accelerationTime_: number, motorSetup_: MotorSetup): void {

        speedLimit = speedLimit_
        pureRotationRate = pureRotationRate_
        mixedRotationRate = mixedRotationRate_

        if (Math.abs(accelerationTime_) < 20) {
            motorSetupMode = MotorSetupMode.Direct
        } else {
            motorSetupMode = MotorSetupMode.Sevro
            accelerationTime = accelerationTime_
            invAccelerationTime = 1.0 / accelerationTime
        }

        bluetooth.startButtonService()
        bluetooth.startLEDService()

        // ---------- control panel setup --------------
        function setTargetVelo() {
            veloTargetL = fullSpeed * veloMultiplierL
            veloTargetR = fullSpeed * veloMultiplierR
        }

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_1_DOWN, function () {
            straightPressed = 1
            fullSpeed = speedLimit
            setTargetVelo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_1_UP, function () {
            straightPressed = 0
            fullSpeed = 0.0
            setTargetVelo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_2_DOWN, function () {
            straightPressed = 1
            fullSpeed = - speedLimit
            setTargetVelo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_2_UP, function () {
            straightPressed = 0
            fullSpeed = 0.0
            setTargetVelo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_3_DOWN, function () {
            if (straightPressed) {
                veloMultiplierL = mixedRotationRate
            } else {
                fullSpeed = speedLimit
                veloMultiplierL = -pureRotationRate
                veloMultiplierR = pureRotationRate
            }
            setTargetVelo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_3_UP, function () {
            if (!(straightPressed)) {
                fullSpeed = 0.0
            }
            veloMultiplierL = 1.0
            veloMultiplierR = 1.0
            setTargetVelo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_4_DOWN, function () {
            if (straightPressed) {
                veloMultiplierR = mixedRotationRate
            } else {
                fullSpeed = speedLimit
                veloMultiplierR = -pureRotationRate
                veloMultiplierL = pureRotationRate
            }
            setTargetVelo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_4_UP, function () {
            if (!(straightPressed)) {
                fullSpeed = 0.0
            }
            veloMultiplierL = 1.0
            veloMultiplierR = 1.0
            setTargetVelo()
        })
        // ---------- control panel setup --------------

        basic.forever(function () {
            if (inControl) {
                if (motorSetupMode == MotorSetupMode.Sevro) {
                    if (Math.abs(timeLast) < 1e-5) {
                        timeCurrent = input.runningTime()
                    }
                    timeCurrent = input.runningTime()
                    dt = timeCurrent - timeLast
                    timeLast = timeCurrent

                    veloL = veloL + invAccelerationTime * (veloTargetL - veloL) * dt
                    veloR = veloR + invAccelerationTime * (veloTargetR - veloR) * dt
                } else {
                    veloL = veloTargetL
                    veloR = veloTargetR
                }

                if (motorSetup_ == MotorSetup.Reversed)
                    wuKong.setAllMotor(veloR, veloL)
                else
                    wuKong.setAllMotor(veloL, veloR)
            }
        })
    }

    //% block="Reset car speed"
    //% weight=10
    export function resetCarSpeed() {
        straightPressed = 0
        veloTargetL = 0.0
        veloTargetR = 0.0
        veloMultiplierL = 1.0
        veloMultiplierR = 1.0

        veloL = 0.0
        veloR = 0.0
        timeCurrent = 0.0
        dt = 0.0
        timeLast = 0.0
    }

    //% block="Get car control"
    //% weight=30
    export function getControl() {
        inControl = true
        resetCarSpeed()
    }

    //% block="Release car control"
    //% weight=20
    export function releaseControl() {
        resetCarSpeed()
        inControl = false
    }

    //% block="Switch car control"
    //% weight=40
    export function switchControl() {
        if (inControl)
           releaseControl()
        else
           getControl()
    }

    //% block="Reset car"
    //% weight=5
    export function resetCar() {
        control.reset()
    }

}

