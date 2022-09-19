function authInit() {
    $("button#btn_authorize").on("click", (e) => {
        $("input[name=cancel]").val("");
        $("form#auth_form").submit();
    });

    $("button#btn_deny").on("click", (e) => {
        $("form#auth_form").submit();
    });
}

authInit();
