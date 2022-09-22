function login(mfaToken = null) {
    let username = $("input[name=username]").val();
    let password = $("input[name=password]").val();

    let redirect_uri = new URL(window.location.href).searchParams.get("redirect_uri");
    let bodyData = {
        username: username,
        password: password
    };
    if(mfaToken) {
        bodyData.totp = mfaToken;
    }

    $.ajax(`/login${redirect_uri ? "?redirect_uri=" + encodeURIComponent(redirect_uri) : ""}`, {
        method: "POST",
        data: bodyData,
        success: (data, status, xhr) => {
            if(xhr.status === 200 && data.ok === true) {
                if(data.mfa) {
                    do2Factor();
                    return;
                }
                postLogin(true, data.redirect_uri);
            } else {
                postLogin(false, false, "Invalid username and/or password.");
            }
        },
        error: (xhr, status, error) => {
            postLogin(false, false, "Invalid username and/or password.");
        }
    });
}

function preLogin() {
    let username = $("input[name=username]").val();
    let password = $("input[name=password]").val();

    if(!username || username == "") {
        postLogin(false, null, "Username missing.");
        return;
    }

    if(!password || password == "") {
        postLogin(false, null, "Password missing.");
        return;
    }

    $(".card-overlay").removeClass("d-none");
    setTimeout(() => login(), 500);
}

function postLogin(success, redirectURI, message) {
    if(success) {
        window.location.href = redirectURI;
    } else {
        $("span.error_message").text(message);
    }
}

function do2Factor() {
    $(".card-overlay").addClass("d-none");
    $(".step_credentials").addClass("d-none");
    $(".step_2fa").removeClass("d-none");
    $(".step_2fa > .twoFA_input > input:first-child").focus();
}

function init() {
    $("input[type=password]").keydown((e) => {
        if (e.key === "Enter") {
            preLogin();
        }
    });
    $("button.login_btn").click((e) => {
        preLogin();
    });
    $("button.mfa_btn").click((e) => {
        let token = "";
        let next = document.querySelector(".twoFA_input > input[type=number]");
        while(next.previousElementSibling) next = e.previousElementSibling;
        for(let i = 0; i < 6; i ++) {
            token += next.value;
            next = next.nextElementSibling;
        }
        console.log(token);
        $(".card-overlay").removeClass("d-none");
        setTimeout(() => login(token), 500);
    })

    document.querySelectorAll(".twoFA_input > input[type=number]").forEach((e) => {
        e.addEventListener("input", (event) => {
            e.value = event.data;
            if(!event.data) {
                e.previousElementSibling?.focus();
            } else {
                e.nextElementSibling?.focus();
            }
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
        });

        e.addEventListener("keydown", (event) => {

            if(e.value?.length <= 0) {
                if(event.key == "Backspace") {
                    e.previousElementSibling?.focus();
                }
            }

        });
    });

}

init();
