/**
 * Script for managing and updating the UI elements
 */

//Variables that represent elements on the page
let setpointSlider;
let setpointReadout;
let batteryVoltageReadout;
let currentDrawReadout;
let speedReadout;
let speedTargetReadout;
let connectionStateReadout;
let faultsContainer;
let faultsCountReadout;
let forwardButton;
let reverseButton;

/**
 * True if the current direction for commands is forward, false if reverse
 * @type {boolean}
 */
let currentDirectionForward = true;

/**
 * True if the jog button is currently being held, false otherwise
 * @type {boolean}
 */
let jogHeld = false;

/**
 * The current fault code from the controller
 * @type {number}
 */
let currentFaultCode = -1;

/**
 * Updates the connection state display
 * @param connected True if we have a connection, false otherwise
 */
function updateConnectionState(connected) {
    if (connected) {
        connectionStateReadout.removeClass("alert-danger");
        connectionStateReadout.addClass("alert-success");
        connectionStateReadout.html("Connected");
    } else {
        connectionStateReadout.removeClass("alert-success");
        connectionStateReadout.addClass("alert-danger");
        connectionStateReadout.html("Not Connected");
    }
}

/**
 * Updates the instruments (readouts)
 * @param batteryVoltage The battery voltage in volts
 * @param batteryState The battery state.  0 is good, 1 is warning, 2 is bad
 * @param currentDraw The current draw in amps
 * @param speed The speed of the vehicle in MPH
 * @param targetSpeed The target speed of the vehicle in MPH
 */
function updateInstruments(batteryVoltage, batteryState, currentDraw, speed, targetSpeed) {
    batteryVoltageReadout.html(batteryVoltage.toFixed(2) + " V");
    if (batteryState === 0) {
        batteryVoltageReadout.removeClass("text-danger");
        batteryVoltageReadout.removeClass("text-warning");
        batteryVoltageReadout.addClass("text-success");
    } else if (batteryState === 1) {
        batteryVoltageReadout.removeClass("text-success");
        batteryVoltageReadout.removeClass("text-danger");
        batteryVoltageReadout.addClass("text-warning");
    } else {
        batteryVoltageReadout.removeClass("text-success");
        batteryVoltageReadout.removeClass("text-warning");
        batteryVoltageReadout.addClass("text-danger");
    }
    currentDrawReadout.html(currentDraw.toFixed(2) + " A");
    if (speed > 0) {
        speedReadout.html(speed.toFixed(2) + " MPH ->");
    } else if (speed < 0) {
        speedReadout.html(speed.toFixed(2) + " MPH <-");
    } else {
        speedReadout.html("0.00 MPH");
    }
    if (targetSpeed > 0) {
        speedTargetReadout.html(targetSpeed.toFixed(2) + " MPH ->");
    } else if (speed < 0) {
        speedTargetReadout.html(targetSpeed.toFixed(2) + " MPH <-");
    } else {
        speedTargetReadout.html("0.00 MPH");
    }
}

/**
 * Gets the current value of the speed setpoint slider
 * @returns {number} The current value of the speed setpoint slider
 */
function getCurrentSpeedSliderValue() {
    return setpointSlider.val();
}

/**
 * Event handler for when the speed setpoint slider changes
 * @param value The current value of the slider
 */
function onSpeedSlider(value) {
    setpointReadout.html(value.toFixed(1) + " MPH");
}

/**
 * Event handler for when a direction button is pressed
 * @param forward True if the forward button was pressed, false if the reverse button was pressed
 */
function onDirectionButton(forward) {
    if (forward) {
        forwardButton.removeClass("btn-secondary"); //Change the forward button color to primary (blue)
        forwardButton.addClass("btn-primary");
        reverseButton.removeClass("btn-primary"); //Change the reverse button color to secondary (gray)
        reverseButton.addClass("btn-secondary");
        currentDirectionForward = true;
    } else {
        forwardButton.removeClass("btn-primary"); //Change the forward button color to secondary (gray)
        forwardButton.addClass("btn-secondary");
        reverseButton.removeClass("btn-secondary"); //Change the reverse button color to primary (blue)
        reverseButton.addClass("btn-primary");
        currentDirectionForward = false;
    }
}

/**
 * Event handler for when the jog button is pressed or released
 * @param pressed True when the jog button is pressed, false when released
 */
function onJogButton(pressed) {
    if (pressed) {
        jogHeld = true;
    } else {
        if (jogHeld) {
            sendStop();
        }
        jogHeld = false;
    }
}

/**
 * Event handler for when the lock (speed set) button is pressed
 */
function onLockButton() {
    jogHeld = false;
    sendSetpoint(getCurrentSpeedSliderValue());
}

/**
 * Event handler for when a stop button is pressed
 */
function onStopButton() {
    jogHeld = false;
    sendStop();
}

function genHtmlForFault(faultIndex) {
    let fault = faultTable[faultIndex];
    let severity = fault["severity"];
    let desc = fault["desc"];

    switch (severity) {
        case 0: //info
            return '<div class="alert alert-info">' + desc + '</div>';
        case 1: //warning
            return '<div class="alert alert-warning">' + desc + '</div>';
        case 2: //critical
            return '<div class="alert alert-danger">' + desc + '</div>';
    }
    return ""; //Unhandled case?
}

function updateFaults(newFaultCode) {
    if (newFaultCode !== currentFaultCode) {
        let genHtml = "";
        let faultCount = 0;
        let binString = newFaultCode.toString(2);
        for (let i = 0; i < 32; i++) {
            if (binString[i] === '1') {
                //The fault at index i is active
                faultCount++;
                genHtml += genHtmlForFault(i);
            }
        }

        if (faultCount === 0) {
            faultsCountReadout.removeClass("text-warning");
            faultsCountReadout.addClass("text-success");
            faultsContainer.html('<div class="alert alert-success">No Faults</div>');
        } else {
            faultsCountReadout.removeClass("text-success");
            faultsCountReadout.addClass("text-warning");
            faultsContainer.html(genHtml);
        }
        faultsCountReadout.html(faultCount);

    }
    currentFaultCode = newFaultCode
}

/**
 * Run when the page loads.  Initializes page element variables
 */
$(document).ready(function() {
    setpointSlider = $("#speed_setpoint");
    setpointReadout = $("#speed_setpoint_readout");
    batteryVoltageReadout = $("#battery_voltage_readout");
    currentDrawReadout = $("#current_draw_readout");
    speedReadout = $("#speed_readout");
    speedTargetReadout = $("#speed_target_readout");
    connectionStateReadout = $("#connection_state_readout");
    forwardButton = $("#forward_button");
    reverseButton = $("#reverse_button");

    faultsContainer = $("#faults_container");
    faultsCountReadout = $("#faults_count_readout");

    let $r = $('input[type="range"]');

    $r.rangeslider({
        polyfill: false,
        onSlide: function(position, value) {
            onSpeedSlider(value);
        }
    });
});