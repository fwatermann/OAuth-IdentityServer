import * as TOTPInput from "/assets/js/totpInput.js";

export function init() {
    TOTPInput.initField(document.querySelector(".twoFA_input"));

    document.querySelector("#mfa_enable")?.addEventListener("click", (e) => {
        let token = TOTPInput.getCode(document.querySelector(".twoFA_input"));
    });

    $(".mfa_settings img").on("click", (e) => {
        let settingsContainer = $(".mfa_settings");
        let qrCodeImg = $(".mfa_settings img:not(.blind)");
        let blindImg = $(".mfa_settings img.blind");
        let secretText = $(".mfa_settings .mfa_secret_text");
        if(settingsContainer.attr("showCode") === "true") {
            qrCodeImg.addClass("d-none");
            blindImg.removeClass("d-none");
            secretText.removeClass("show");
            settingsContainer.attr("showCode", "false");
        } else {
            qrCodeImg.removeClass("d-none");
            blindImg.addClass("d-none");
            secretText.addClass("show");
            settingsContainer.attr("showCode", "true");
        }
    });

    $("#mfa_enable").click("on", () => {
        enable2FA();
    });

    console.log("INIT: Security");
}

function enable2FA() {
    let code = TOTPInput.getCode(document.querySelector(".twoFA_input"));
    TOTPInput.showError(document.querySelector(".twoFA_input"), "Invalid token. Please try again.");
}
