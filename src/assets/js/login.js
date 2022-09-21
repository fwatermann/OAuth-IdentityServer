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
                postLogin(true, data.redirect_uri);
            } else {
                postLogin(false, null, "Invalid username and/or password.");
            }
        },
        error: (xhr, status, error) => {
            postLogin(false, null, "Invalid username and/or password.");
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
    $(".card-overlay").addClass("d-none");

    if(success) {
        window.location.href = redirectURI;
    } else {
        $("span.error_message").text(message);
    }
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
}

init();
