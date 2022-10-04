export function initField(element) {
    if(!element) return;
    element.querySelectorAll("input[type=number]").forEach((e) => {
        e.addEventListener("input", (event) => {
            e.value = event.data;
            if(!event.data) {
                e.previousElementSibling?.focus();
            } else {
                e.nextElementSibling?.focus();
            }
            hideError(element);
        });
        e.addEventListener("paste", (event) => {
            const allowedChars = "0123456789";
            event.preventDefault();
            let next = e;
            while(next.previousElementSibling) next = e.previousElementSibling;
            let content = event.clipboardData.getData("text").replaceAll(" ", "");
            for(let i = 0; i < 6; i ++) {
                if(allowedChars.indexOf(content.charAt(i)) >= 0) {
                    next.focus();
                    next.value = content.charAt(i);
                }
                next = next.nextElementSibling;
            }
            hideError(element);
        });

        e.addEventListener("keydown", (event) => {
            if(e.value?.length <= 0) {
                if(event.key === "Backspace") {
                    e.previousElementSibling?.focus();
                }
            }
            hideError(element);
        });
    });
}

export function getCode(element, length=6) {
    if(!element) return "";
    let token = "";
    let next = element.querySelector("input[type=number]");
    while(next.previousElementSibling) next = next.previousElementSibling;
    for(let i = 0; i < length; i ++) {
        token += next.value;
        next = next.nextElementSibling;
        if(!next) break;
    }
    return token;
}

export function showError(element, message) {
    $(element).addClass("error");
    $(element).find(".error_message").text(message);
}

export function hideError(element) {
    $(element).removeClass("error");
    $(element).find(".error_message").text("");
}

export function clearInput(element) {
    let next = element.querySelector("input[type=number]");
    while(next.previousElementSibling) next = next.previousElementSibling;
    for(let i = 0; i < length; i ++) {
        next.value = "";
        next = next.nextElementSibling;
        if(!next) break;
    }
}


