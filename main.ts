input.onButtonPressed(Button.AB, function () {
    controlCar.switchControl()
})
controlCar.carServoSpeed(100, 0.3, 0.2, 10, MotorSetup.Reversed)
