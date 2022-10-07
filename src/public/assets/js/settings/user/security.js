import "https://cdn.w-mi.de/jquery/jquery_v3.6.0/jquery.min.js";
import * as TOTPInput from "/assets/js/totpInput.js";
import * as modal from "/assets/js/modal.js";

export function init() {
    modal.initModals();
    TOTPInput.initField(document.querySelector(".twoFA_input"));

    $("#btn_2fa_enable").on("click", () => {
        modal.showModal("enable2fa");

        $.getJSON("/api/user/2fa/data").done((data) => {
            if(data.status === "enabled") {
                alert("ALREADY ENABLED!");
                return;
            }
            $("modal[mid='enable2fa'] .mfa_secret_text").text(data.secret);
            $("modal[mid='enable2fa'] img").attr("src", data.qrCodeURL);
            $("modal[mid='enable2fa'] .card .card-overlay").addClass("d-none");
        }).fail((xhr, textStatus, error) => {
            alert("FAIL");
        }).always();

    });

    $("#btn_2fa_disable").on("click", () => {
        modal.showModal("disable2fa");
    })

    $("#modal_enable_2fa").on("click", () => {
        enable2FA();
    });

    $("#modal_disable_2fa").on("click", () => {
        disable2FA();
    });

    console.log("INIT: Security");
}

function enable2FA() {
    let modalElement = $("modal[mid='enable2fa']");
    let input = modalElement.find(".twoFA_input");
    modalElement.find(".card .card-overlay").removeClass("d-none");
    let code = TOTPInput.getCode(modalElement.find(".twoFA_input")[0]);

    $.post({
        method: "POST",
        url: "/api/user/2fa",
        data: JSON.stringify({
            secret: $(".mfa_secret_text").text(),
            mfaCode: code,
            status: "enable"
        }),
        dataType: "json",
        contentType: "application/json"
    }).done(() => {
        modalElement.find(".card .card-overlay").addClass("d-none");
        window.loadPage("user/security");
    }).fail((xhr, textStatus, error) => {
        if(xhr.status === 400) {
            TOTPInput.showError(input[0], "Token invalid. Try again!");
            return;
        }
        if(xhr.status >= 500) {
            TOTPInput.showError(input[0], "Could not enable 2FA. Try again later!");
            return;
        }
        TOTPInput.showError(input[0], "Something went wrong. Please try again later.");
    }).always(() => {
        modalElement.find(".card .card-overlay").addClass("d-none");
    });
}

function disable2FA() {

    let modalElement = $("modal[mid='disable2fa']");

    $.post({
        method: "POST",
        url: "/api/user/2fa",
        data: JSON.stringify({
            status: "disable"
        }),
        dataType: "json",
        contentType: "application/json"
    }).done(() => {
        window.loadPage("user/security");
    }).fail((xhr, textStatus, error) => {
        modalElement.find(".card .card-footer").prepend($(`<span class="text-danger">Something went wrong. Please try again later.</span>`));
    }).always(() => {
        modalElement.find(".card .card-overlay").addClass("d-none");
    });
}

function changePassword() {

    let currentPassword = $("input[name='current_password']").val();
    let newPassword = $("input[name='new_password']").val();
    let newPasswordRepeat = $("input[name='confirm_password']").val();

    if(newPassword !== newPasswordRepeat) {
        alert("Passwords do not match!");
        return;
    }

}
