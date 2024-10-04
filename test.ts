// tests go here; this will not be compiled when this package is used as an extension.

input.onButtonPressed(Button.A, function () {
    controlCar.resetCarSpeed()
})
input.onButtonPressed(Button.B, function () {
    controlCar.resetCar()
})
controlCar.carServoSpeed(100, 0.3, 0.2, 0, MotorSetup.Reversed)
