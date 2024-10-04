
input.onButtonPressed(Button.A, function () {
    controlCar.resetCarSpeed()
})
input.onButtonPressed(Button.B, function () {
    controlCar.resetCar()
})
controlCar.carServoSpeed(100, 0.3, 0.2, 0, MotorSetup.Reversed)
