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
                postLogin(false, null);
            }
        },
        error: (xhr, status, error) => {
            postLogin(false, null);
        }
    });
}

function preLogin() {
    $("input[type=text]").prop("disabled", true);
    $("input[type=password]").prop("disabled", true);
    $("input[type=submit]").prop("disabled", true);
    login();
}

function postLogin(success, redirectURI) {
    $("input[type=text]").prop("disabled", false);
    $("input[type=password]").prop("disabled", false);
    $("input[type=submit]").prop("disabled", false);

    if(success) {
        window.location.href = redirectURI;
    } else {
        alert("Login failed!");
    }
}

function init() {
    $("input[type=password]").keydown((e) => {
        if (e.key === "Enter") {
            preLogin();
        }
    });
    $("input[type=submit]").click((e) => {
        preLogin();
    });
}

init();
