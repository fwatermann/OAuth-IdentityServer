import "https://cdn.w-mi.de/jquery/jquery_v3.6.0/jquery.min.js";

const modalShowCSS = {
    'display': "flex",
    'flex-flow': "row wrap",
    'column-gap': "10px",
    'row-gap': "10px",
    'justify-content': "center",
    'align-items': "center",
    'position': "fixed",
    'top': "0",
    'left': "0",
    'width': "100vW",
    'height': "100vH",
    'background-color': "#00000080",
};

const modalHideCSS = {
    'display': "none"
}
export function showModal(mid) {
    if(!mid) return;
    let modalElement = $(`modal[mid="${mid}"]`);
    modalElement.on("click", (event) => {
        if($(event.target).attr("mid") === mid) {
            hideModal(mid);
        }
    });
    modalElement.css(modalShowCSS);
    modalElement.children().each((index, item) => {
        let transform = $(item).css("transform") === "none" ? "" : $(item).css("transform");
        $(item).attr("transform", transform);
        $(item).css({
            transform: `${transform} translateY(-25%)`,
            transition: "transform 0.5s ease"
        });
    });
    modalElement.children().fadeIn();
    modalElement.children().each((index, item) => {
        $(item).css("transform", $(item).attr("transform"));
        $(item).attr("transform", null);
    });
}

export function hideModal(mid) {
    if(!mid) return;
    let modal = $(`modal[mid="${mid}"`);
    modal.css(modalHideCSS);
    modal.unbind("click");
    modal.children().hide();
}

export function initModals() {
    let modals = $("modal[mid]")
    modals.css(modalShowCSS);
    modals.css(modalHideCSS);
    modals.children().hide();
}
