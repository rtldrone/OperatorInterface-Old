var setpointSlider;
var setpointReadout;
var batteryVoltageIndicator;
var velocityIndicator;
var currentFaults = [];

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

    var $r = $('input[type="range"]');

    $r.rangeslider({
        polyfill: false,
        onSlide: function(position, value) {
            updateSlider(value, true);
        }
    });
});