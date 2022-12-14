let namespace;

function initSettings() {
    let menuEntries = $("[linkType=menu_1]");
    menuEntries.attr("href", "#");
    menuEntries.on("click", (event) => {
        let target = $(event.target);
        if(target.parent().hasClass("active")) return;
        let page = target.attr("menu");
        $(".menu-body .active").removeClass("active");
        target.parent().addClass("active");
        loadPage(page);
    });
}

function loadPage(page) {
    $(".container-body").load(`/settings/page/${page}`, () => {
        import(`/assets/js/settings/${page}.js`).then((result) => {
            delete window.namespace;
            window.namespace = result;
            if(window.namespace) {
                window.namespace.init();
            }
            console.log(window.namespace);
        }).catch((reason) => {
            console.error("Could not load script of page: \n" + reason);
            delete window.namespace;
        });
    });
}

window.loadPage = loadPage;

initSettings();
