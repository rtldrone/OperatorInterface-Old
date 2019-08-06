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

const socket = new ReconnectingWebSocket(CONTROLLER_URL, null, {reconnectInterval: CONNECT_RETRY_INTERVAL_MS}); //WebSocket used to communicate with the controller
socket.onmessage = onUpdate;

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
    const buf = new ArrayBuffer(5);
    const view = new DataView(buf);
    view.setUint8(0, 86); //86 = ASCII character 'V'
    view.setFloat32(1, setpoint, true);

    try {
        socket.send(buf);
    } catch {}
}

async function onUpdate(event) {
    const arrayBuffer = await new Response(event.data).arrayBuffer();
    const view = new DataView(arrayBuffer);

    const batteryVoltage = view.getFloat32(0);
    const batteryState = view.getUint8(4);
    const velocity = view.getFloat32(5);
    const velocitySetpoint = view.getFloat32(9);
    const faultCode = view.getUint32(13);

    updateInstruments(batteryVoltage, batteryState, velocity);
}

setInterval(sendUpdate, UPDATE_RATE_MS); //Starts the update loop