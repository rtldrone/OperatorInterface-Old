let setpointSlider;
let setpointReadout;
let batteryVoltageIndicator;
let velocityIndicator;
let connectionReadout;

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


var currentFaults = [];

function updateConnectionState(connected) {
    if (connected) {
        connectionReadout.removeClass("alert-danger");
        connectionReadout.addClass("alert-success");
        connectionReadout.html("Connected");
    } else {
        connectionReadout.removeClass("alert-success");
        connectionReadout.addClass("alert-danger");
        connectionReadout.html("Not Connected");
    }
}

function updateInstruments(batteryVoltage, batteryState, velocity) {
    batteryVoltageIndicator.html(batteryVoltage.toFixed(2) + " V");
    if (batteryState === 0) {
        batteryVoltageIndicator.removeClass("text-danger");
        batteryVoltageIndicator.removeClass("text-warning");
        batteryVoltageIndicator.addClass("text-success");
    } else if (batteryState === 1) {
        batteryVoltageIndicator.removeClass("text-success");
        batteryVoltageIndicator.removeClass("text-danger");
        batteryVoltageIndicator.addClass("text-warning");
    } else {
        batteryVoltageIndicator.removeClass("text-success");
        batteryVoltageIndicator.removeClass("text-warning");
        batteryVoltageIndicator.addClass("text-danger");
    }
    velocityIndicator.html(velocity.toFixed(2) + " MPH");
}

function updateSlider(value, fromSlider = false) {
    if (!fromSlider) { //Prevent recursive calls when we call this from the slider
        setpointSlider.val(value).change();
    }
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
        jogHeld = false;
        sendStop();
    }
}

/**
 * Event handler for when the lock (speed set) button is pressed
 */
function onLockButton() {
    jogHeld = false;
    sendSetpoint(getCurrentSliderValue());
}

/**
 * Event handler for when a stop button is pressed
 */
function onStopButton() {
    jogHeld = false;
    sendStop();
}

function getCurrentSliderValue() {
    return setpointSlider.val();
}

function isFaultEqual(fault1, fault2) {
    return (fault1["fault"] === fault2["fault"] && fault1["severity"] === fault2["severity"]);
}

function genHtmlForFault(fault, severity) {
    switch (severity) {
        case "info":
            return '<div class="alert alert-info">' + fault + '</div>';
        case "warning":
            return '<div class="alert alert-warning">' + fault + '</div>';
        case "error":
            return '<div class="alert alert-danger">' + fault + '</div>';
    }
    return ""; //Unhandled case?
}

function doFaultsNeedUpdate(faultList) {
    if (currentFaults.length != faultList.length) {
        return true;
    }

    for (let i = 0; i < currentFaults.length; i++) {
        if (!isFaultEqual(currentFaults[i], faultList[i])) {
            return true;
        }
    }

    return false;
}

function updateFaults(faultList) {
    if (doFaultsNeedUpdate(faultList)) {
        currentFaults = faultList;
        var genHtml = "";
        if (currentFaults.length == 0) {
            genHtml = '<h4 class="text-success">No faults.</h4>';
        } else {
            currentFaults.forEach(function (element) {
                genHtml += genHtmlForFault(element["fault"], element["severity"]);
            });
        }
        $("#faults_container").html(genHtml);
    }
}

$(document).ready(function() {
    setpointSlider = $("#speed_setpoint");
    setpointReadout = $("#speed_setpoint_readout");
    batteryVoltageIndicator = $("#battery_voltage_indicator");
    velocityIndicator = $("#velocity_indicator");
    connectionReadout = $("#connection_readout");

    forwardButton = $("#forward_button");
    reverseButton = $("#reverse_button");

    var $r = $('input[type="range"]');

    $r.rangeslider({
        polyfill: false,
        onSlide: function(position, value) {
            updateSlider(value, true);
        }
    });
});