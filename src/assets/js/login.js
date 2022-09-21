function login() {
    let username = $("input[name=username]").val();
    let password = $("input[name=password]").val();

    let redirect_uri = new URL(window.location.href).searchParams.get("redirect_uri");

    $.ajax(`/login${redirect_uri ? "?redirect_uri=" + encodeURIComponent(redirect_uri) : ""}`, {
        method: "POST",
        data: {
            username: username,
            password: password
        },
        success: (data, status, xhr) => {
            if(xhr.status === 200 && data.ok === true) {
                postLogin(true, data.mfa??false, data.redirect_uri);
            } else {
                postLogin(false, false, null, "Invalid username and/or password.");
            }
        },
        error: (xhr, status, error) => {
            postLogin(false, false, null, "Invalid username and/or password.");
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

function postLogin(success, mfa, redirectURI, message) {
    $(".card-overlay").addClass("d-none");

    if(success) {
        window.location.href = redirectURI;
    } else {
        $("span.error_message").text(message);
    }
}

function do2Factor() {
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
            let content = event.clipboardData.getData("text");
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
