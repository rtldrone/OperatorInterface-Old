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
let levelCrossingButton;
let switchButton;
let tunnelButton;
let bridgeButton;
let highlightButton;
let recordButton;

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
 * True if the level crossing button is currently being held, false otherwise
 * @type {boolean}
 */
let levelCrossingHeld = false;

/**
 * True if the switch button is currently being held, false otherwise
 * @type {boolean}
 */
let switchHeld = false;

/**
 * True if the flange applicator button was pressed.  Will be set to false once the event is sent to the controller
 * @type {boolean}
 */
let flangeApplicatorEventOccurred = false;

/**
 * True if the TOR applicator button was pressed.  Will be set to false once the event is sent to the controller
 * @type {boolean}
 */
let torApplicatorEventOccurred = false;

/**
 * True if the mile post button was pressed.  Will be set to false once the event is sent to the controller
 * @type {boolean}
 */
let milePostEventOccurred = false;

/**
 * True if the signal button was pressed.  Will be set to false once the event is sent to the controller
 * @type {boolean}
 */
let signalEventOccurred = false;

/**
 * True if the tunnel button is currently active, false otherwise
 * @type {boolean}
 */
let tunnelActive = false;

/**
 * True if the bridge button is currently active, false otherwise
 * @type {boolean}
 */
let bridgeActive = false;

/**
 * True if the highlight button is currently active, false otherwise
 * @type {boolean}
 */
let highlightActive = false;

/**
 * The current fault code from the controller
 * @type {number}
 */
let currentFaultCode = -1;

/**
 * Utility function to toggle a button's appearance between primary and secondary
 * @param button Button object
 * @param state True for primary, false for secondary
 */
function toggleButton(button, state) {
    if (state) {
        button.removeClass("btn-secondary");
        button.addClass("btn-primary");
    } else {
        button.removeClass("btn-primary");
        button.addClass("btn-secondary");
    }
}

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
    toggleButton(forwardButton, forward);
    toggleButton(reverseButton, !forward);
    currentDirectionForward = forward;
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

/**
 * Event handler for when the level crossing button is pressed or released
 * @param pressed True when the level crossing button is pressed, false when released
 */
function onLevelCrossingButton(pressed) {
    toggleButton(levelCrossingButton, pressed);
    levelCrossingHeld = pressed;
}

/**
 * Event handler for when the switch button is pressed or released
 * @param pressed True when the switch button is pressed, false when released
 */
function onSwitchButton(pressed) {
    toggleButton(switchButton, pressed);
    switchHeld = pressed;
}

/**
 * Event handler for when the flange applicator button is pressed
 */
function onFlangeApplicatorButton() {
    flangeApplicatorEventOccurred = true;
}

/**
 * Event handler for when the TOR applicator button is pressed
 */
function onTorApplicatorButton() {
    torApplicatorEventOccurred = true;
}

/**
 * Event handler for when the mile post button is pressed
 */
function onMilePostButton() {
    milePostEventOccurred = true;
}

/**
 * Event handler for when the signal button is pressed
 */
function onSignalButton() {
    signalEventOccurred = true;
}

/**
 * Event handler for when the tunnel button is pressed
 */
function onTunnelButton() {
    toggleButton(tunnelButton, !tunnelActive);
    tunnelActive = !tunnelActive;
}

/**
 * Event handler for when the bridge button is pressed
 */
function onBridgeButton() {
    toggleButton(bridgeButton, !bridgeActive);
    bridgeActive = !bridgeActive;
}

/**
 * Event handler for when the highlight button is pressed
 */
function onHighlightButton() {
    toggleButton(highlightButton, !highlightActive);
    highlightActive = !highlightActive;
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
    levelCrossingButton = $("#level_crossing_button");
    switchButton = $("#switch_button");
    tunnelButton = $("#tunnel_button");
    bridgeButton = $("#bridge_button");
    highlightButton = $("#highlight_button");
    recordButton = $("#record_button");

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