export function listenCanvasMessage(app, event_name, callback) {
    window.addEventListener("message", (event) => {
        if (
            event.data.from &&
            event.data.from == "OCC" &&
            event.data.command == "BroadcastToAllApps" &&
            event.data.payload.event == event_name &&
            event.data.payload.app == app
        ) {
            callback(event.data.payload);
        }
    });
}

export function messageCanvas(canvas, app, event_name, message_payload) {
    let payload = message_payload || {};
    canvas.canvasRawCommand("BroadcastToAllApps", {
        ...payload,
        app,
        event: event_name,
    });
}
