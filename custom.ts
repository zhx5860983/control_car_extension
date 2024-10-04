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
//% weight=100 color=#0fbc11 icon="\10f0d1"
namespace ControlCar {

    let straight_pressed = 0

    let velo_r_target = 0.0
    let velo_l_target = 0.0
    let velo_multiplier_r = 1.0
    let velo_multiplier_l = 1.0
    let full_speed = 0.0
    let speed_limit = 100.0

    let pure_rotation_rate = 0.3
    let mixed_rotation_rate = 0.2

    let motor_setup_mode = MotorSetupMode.Direct;
    let dt = 0.0
    let time_current = 0.0
    let time_last = 0.0
    let velo_r = 0.0
    let velo_l = 0.0
    let acceleration_time = 50
    let inv_acceleration_time = 1.0 / acceleration_time

    /**
     * @param speed_limit_ is the highest rotational speed of motors
     * @param pure_rotation_rate_ is the speed of motors (as a rate of highest speed) used for pure rotation
     * @param mixed_rotation_rate_ is the speed of motors (as a rate of highest speed) used for mixed rotation
     * @param acceleration_time_ is the rate of current RPM convergening to terget RPM
     * @param motor_setup_ is Reversed, when motor1 and motor2 corresponse to wheel_right and wheel_left, otherwise 0
     */
    //% block="Car servo control || with maxRPM $speed_limit_|PRR $pure_rotation_rate_|MRR $mixed_rotation_rate_|acceleration time $acceleration_time_|and $motor_setup_|motor setup|"
    //% speed_limit_.min=20.0 pure_rotation_rate_.max=100.0 
    //% speed_limit_.defl=100.0
    //% pure_rotation_rate_.min=0.0 pure_rotation_rate_.max=1.0
    //% pure_rotation_rate_.defl=0.3
    //% mixed_rotation_rate_.min=0.0 mixed_rotation_rate_.max=0.6
    //% mixed_rotation_rate_.defl=0.2
    //% acceleration_time_.min=20 acceleration_time_.max=1000
    //% acceleration_time_.defl=0
    //% acceleration_time_.shadow=timePicker
    //% expendableArgumentMode="toggle"
    //% motor_setup_.defl=MotorSetup.Reversed
    //% weight=50
    //% inlineInputMode=inline
    export function car_servo_speed(speed_limit_: number, pure_rotation_rate_: number, mixed_rotation_rate_: number,
        acceleration_time_: number, motor_setup_: MotorSetup): void {

        speed_limit = speed_limit_
        pure_rotation_rate = pure_rotation_rate_
        mixed_rotation_rate = mixed_rotation_rate_

        if (Math.abs(acceleration_time_) < 20) {
            motor_setup_mode = MotorSetupMode.Direct
        } else {
            motor_setup_mode = MotorSetupMode.Sevro
            acceleration_time = acceleration_time_
            inv_acceleration_time = 1.0 / acceleration_time
        }

        bluetooth.startButtonService()
        bluetooth.startLEDService()

        // ---------- control panel setup --------------
        function set_target_velo() {
            velo_l_target = full_speed * velo_multiplier_l
            velo_r_target = full_speed * velo_multiplier_r
        }

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_1_DOWN, function () {
            straight_pressed = 1
            full_speed = speed_limit
            set_target_velo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_1_UP, function () {
            straight_pressed = 0
            full_speed = 0.0
            set_target_velo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_2_DOWN, function () {
            straight_pressed = 1
            full_speed = - speed_limit
            set_target_velo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_2_UP, function () {
            straight_pressed = 0
            full_speed = 0.0
            set_target_velo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_3_DOWN, function () {
            if (straight_pressed) {
                velo_multiplier_l = mixed_rotation_rate
            } else {
                full_speed = speed_limit
                velo_multiplier_l = -pure_rotation_rate
                velo_multiplier_r = pure_rotation_rate
            }
            set_target_velo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_3_UP, function () {
            if (!(straight_pressed)) {
                full_speed = 0.0
            }
            velo_multiplier_l = 1.0
            velo_multiplier_r = 1.0
            set_target_velo()
        })

        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_4_DOWN, function () {
            if (straight_pressed) {
                velo_multiplier_r = mixed_rotation_rate
            } else {
                full_speed = speed_limit
                velo_multiplier_r = -pure_rotation_rate
                velo_multiplier_l = pure_rotation_rate
            }
            set_target_velo()
        })
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MES_DPAD_BUTTON_4_UP, function () {
            if (!(straight_pressed)) {
                full_speed = 0.0
            }
            velo_multiplier_l = 1.0
            velo_multiplier_r = 1.0
            set_target_velo()
        })
        // ---------- control panel setup --------------

        basic.forever(function () {
            if (motor_setup_mode == MotorSetupMode.Sevro) {
                if (Math.abs(time_last) < 1e-5) {
                    time_current = input.runningTime()
                }
                time_current = input.runningTime()
                dt = time_current - time_last
                time_last = time_current

                velo_l = velo_l + inv_acceleration_time * (velo_l_target - velo_l) * dt
                velo_r = velo_r + inv_acceleration_time * (velo_r_target - velo_r) * dt
                if (motor_setup_ == MotorSetup.Reversed)
                    wuKong.setAllMotor(velo_r, velo_l)
                else
                    wuKong.setAllMotor(velo_l, velo_r)
            } else {
                if (motor_setup_ == MotorSetup.Reversed)
                    wuKong.setAllMotor(velo_r_target, velo_l_target)
                else
                    wuKong.setAllMotor(velo_l_target, velo_r_target)
            }
        })
    }

    //% block="Reset car speed"
    //% weight=10
    export function reset_car_speed() {
        straight_pressed = 0
        velo_l_target = 0.0
        velo_r_target = 0.0
        velo_multiplier_l = 1.0
        velo_multiplier_r = 1.0

        velo_l = 0.0
        velo_r = 0.0
        time_current = 0.0
        dt = 0.0
        time_last = 0.0
    }

    //% block="Reset car"
    //% weight=5
    export function reset_car() {
        control.reset()
    }

}

