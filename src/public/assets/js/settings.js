
function initSettings() {
    let menuEntries = $("[linkType=menu_1]");
    menuEntries.attr("href", "#");
    menuEntries.on("click", (event) => {
        console.log(event);
        let target = $(event.target);
        let page = target.attr("menu");
        $(".menu-body .active").removeClass("active");
        target.parent().addClass("active");
        $(".container-body").load(`/settings/page/${page}`);
    });
}

initSettings();
