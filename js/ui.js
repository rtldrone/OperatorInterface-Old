var setpointSlider;
var setpointReadout;
var currentFaults = [];

function updateSlider(value, fromSlider = false) {
    if (!fromSlider) { //Prevent recursive calls when we call this from the slider
        setpointSlider.val(value).change();
    }
    setpointReadout.html(value);
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

    var $r = $('input[type="range"]');

    $r.rangeslider({
        polyfill: false,
        onSlide: function(position, value) {
            updateSlider(value, true);
        }
    });
});