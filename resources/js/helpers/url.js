export function encodeAllUrlComponents(parameters) {
    return Object.entries(parameters)
        .map((value) => value.map(encodeURIComponent).join("="))
        .join("&");
}

export function uiKitUrl(interface_name, variables) {
    const base_url =
        window.location.protocol +
        "//" +
        window.location.host +
        (!window.location.host.match(/\:/) && window.location.port != 80
            ? ":" + window.location.port
            : "");
    let url =
        base_url +
        "/ui-kit/" +
        interface_name +
        "?" +
        encodeAllUrlComponents(variables ? variables : {});

    return url;
}
