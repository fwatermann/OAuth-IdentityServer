
function show(level, title, message, position = "top-right", timeout = 5000) {

    let container = $("toastList[position='" + position + "']");
    if(container.length === 0) {
       container = createContainer(position);
    }

    let toast = $("<toast></toast>");
    toast.css({
        "animation": "toastIn 0.5s ease-in-out",
        "animation-fill-mode": "forwards"
    });



}

function createContainer(position) {

    let container = $(`<toastList position="${position}"></toastList>`);
    container.css({
        position: "fixed",
        display: "flex",
        "flex-flow": "column nowrap",
        "justify-content": "flex-start",
        "align-items": "flex-start",
    });

    switch(position) {
        case "top-left":
            container.css({
                top: "50px",
                left: "50px",
            });
            break;
        case "top-right":
            container.css({
                top: "50px",
                right: "50px",
            });
            break;
        case "bottom-left":
            container.css({
                bottom: "50px",
                left: "50px",
            });
            break;
        case "bottom-right":
            container.css({
                bottom: "50px",
                right: "50px",
            });
            break;
        case "top-center":
            container.css({
                top: "50px",
                left: "50%",
                transform: "translateX(-50%)",
            });
            break;
        case "bottom-center":
            container.css({
                bottom: "50px",
                left: "50%",
                transform: "translateX(-50%)",
            });
            break;
        default:
            container.css({
                top: "50px",
                right: "50px",
            });
            break;
    }

    container.appendTo("body");
    return container;
}

export function danger(title, message) {
    show("danger", title, message);
}

export function success(title, message) {
    show("success", title, message);
}

export function warning(title, message) {
    show("warning", title, message);
}

export function info(title, message) {
    show("info", title, message);
}

export function primary(title, message) {
    show("primary", title, message);
}

export function secondary(title, message) {
    show("secondary", title, message);
}
