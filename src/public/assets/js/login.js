import * as TOTPInput from "/assets/js/totpInput.js";

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
            if(xhr.status >= 500) {
                postLogin(false, false, "Something went wrong while processing your request. Please try again later.")
                return;
            }
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
        $(".card-overlay").addClass("d-none");
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
        let token = TOTPInput.getCode(document.querySelector(".twoFA_input"));
        console.log(token);
        $(".card-overlay").removeClass("d-none");
        setTimeout(() => login(token), 500);
    });
    TOTPInput.initField(document.querySelector(".twoFA_input"));
}

init();
