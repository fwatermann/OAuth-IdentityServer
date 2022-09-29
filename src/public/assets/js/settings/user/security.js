import * as TOTPInput from "/assets/js/totpInput.js";

export function init() {
    TOTPInput.initField(document.querySelector(".twoFA_input"));

    document.querySelector("#mfa_enable")?.addEventListener("click", (e) => {
        let token = TOTPInput.getCode(document.querySelector(".twoFA_input"));
        alert(token);
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

    console.log("INIT: Security");
}
