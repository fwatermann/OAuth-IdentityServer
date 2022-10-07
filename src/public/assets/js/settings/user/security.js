import "https://cdn.w-mi.de/jquery/jquery_v3.6.0/jquery.min.js";
import * as TOTPInput from "/assets/js/totpInput.js";
import * as modal from "/assets/js/modal.js";

export function init() {
    modal.initModals();
    TOTPInput.initField(document.querySelector(".twoFA_input"));

    $("#btn_2fa_enable").click("on", () => {
        modal.showModal("enable2fa");
        //enable2FA();
    });

    console.log("INIT: Security");
}

function enable2FA() {
    let code = TOTPInput.getCode(document.querySelector(".twoFA_input"));
    TOTPInput.showError(document.querySelector(".twoFA_input"), "Invalid token. Please try again.");
}
