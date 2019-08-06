/**
 * Script for handling communications between the operator interface and the vehicle controller.
 */
 const CONTROLLER_URL = "ws://192.168.4.1/ws"; //WebSocket address of the controller.  This should be known and constant, since the controller is assigning the addresses.
 const CONNECT_RETRY_INTERVAL_MS = 5000; //Number of milliseconds to wait before trying to reconnect to the controller if communications are lost
 const UPDATE_RATE_MS = 250; //Rate to send update packets to the controller.  Care should be taken to ensure this is less than the controller's timeout value

 var hidden; //Key for the Page Visibility API.  The key depends on what browser is being used, so we need to check that and assign it
             //This is used to access whether or not the user has the page visible on the screen, to determine if we should send updates to the controller
 if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
}

// Based on code from Jonas Raoni Soares Silva
// http://jsfromhell.com/classes/binary-parser
function encodeFloat(number) {
    var n = +number,
        status = (n !== n) || n == -Infinity || n == +Infinity ? n : 0,
        exp = 0,
        len = 281, // 2 * 127 + 1 + 23 + 3,
        bin = new Array(len),
        signal = (n = status !== 0 ? 0 : n) < 0,
        n = Math.abs(n),
        intPart = Math.floor(n),
        floatPart = n - intPart,
        i, lastBit, rounded, j, exponent;

    if (status !== 0) {
        if (n !== n) {
            return 0x7fc00000;
        }
        if (n === Infinity) {
            return 0x7f800000;
        }
        if (n === -Infinity) {
            return 0xff800000
        }
    }

    i = len;
    while (i) {
        bin[--i] = 0;
    }

    i = 129;
    while (intPart && i) {
        bin[--i] = intPart % 2;
        intPart = Math.floor(intPart / 2);
    }

    i = 128;
    while (floatPart > 0 && i) {
        (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart;
    }

    i = -1;
    while (++i < len && !bin[i]);

    if (bin[(lastBit = 22 + (i = (exp = 128 - i) >= -126 && exp <= 127 ? i + 1 : 128 - (exp = -127))) + 1]) {
        if (!(rounded = bin[lastBit])) {
            j = lastBit + 2;
            while (!rounded && j < len) {
                rounded = bin[j++];
            }
        }

        j = lastBit + 1;
        while (rounded && --j >= 0) {
            (bin[j] = !bin[j] - 0) && (rounded = 0);
        }
    }
    i = i - 2 < 0 ? -1 : i - 3;
    while(++i < len && !bin[i]);
    (exp = 128 - i) >= -126 && exp <= 127 ? ++i : exp < -126 && (i = 255, exp = -127);
    (intPart || status !== 0) && (exp = 128, i = 129, status == -Infinity ? signal = 1 : (status !== status) && (bin[i] = 1));

    n = Math.abs(exp + 127);
    exponent = 0;
    j = 0;
    while (j < 8) {
        exponent += (n % 2) << j;
        n >>= 1;
        j++;
    }

    var mantissa = 0;
    n = i + 23;
    for (; i < n; i++) {
        mantissa = (mantissa << 1) + bin[i];
    }
    return ((signal ? 0x80000000 : 0) + (exponent << 23) + mantissa) | 0;
}

const socket = new ReconnectingWebSocket(CONTROLLER_URL, null, {reconnectInterval: CONNECT_RETRY_INTERVAL_MS}); //WebSocket used to communicate with the controller

var lastSocketState = socket.readyState;

/**
 * Sends an update request to the controller
 * A request is only sent if the browser is visible and the socket is connected.
 */
function sendUpdate() {
    if (socket.readyState != WebSocket.OPEN) { //If the socket is not connected
        updateFaults([{fault: "No connection to controller", severity: "warning"}]);
    }
    if (socket.readyState == WebSocket.OPEN && lastSocketState != WebSocket.OPEN) { //If the socket is now connected but wasn't last time
        updateFaults([]);
    }
    lastSocketState = socket.readyState;
    if (!document[hidden]) {
        try {
            socket.send("U");
        } catch {} //Ignore any exceptions, this just means we aren't connected
    }
}

/**
 * Sends a stop command to the controller
 */
function sendStop() {
    try {
        socket.send("X");
    } catch {}
}

function sendSetpoint(setpoint) {
    var buf = new ArrayBuffer(5);
    var view = new DataView(buf);
    view.setUint8(0, 86); //86 = ASCII character 'V'
    view.setFloat32(1, setpoint, true); //For some reason JS is big-endian by default???

    try {
        socket.send(buf);
    } catch {}
}

/**
 * Function called when we get data from the controller.
 * @param event The event object
 */
function onResponse(event) {

}

setInterval(sendUpdate, UPDATE_RATE_MS); //Starts the update loop