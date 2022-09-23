
$("#btn_details").on("click", () => {
   $(".card.card-active").removeClass("card-active");
   $(".card.card_details").addClass("card-active");
});

$("#btn_security").on("click", () => {
    $(".card.card-active").removeClass("card-active");
    $(".card.card_security").addClass("card-active");
});

$("#btn_access").on("click", () => {
    $(".card.card-active").removeClass("card-active");
    $(".card.card_access").addClass("card-active");
});

$("#btn_danger").on("click", () => {
    $(".card.card-active").removeClass("card-active");
    $(".card.card_danger").addClass("card-active");
});
