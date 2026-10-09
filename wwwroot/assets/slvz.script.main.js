document.querySelector('body').addEventListener('click', () => {
    CloseDropList();
});





//================= Drop list ==============================
function CloseDropList() {
    var elements = document.querySelectorAll('.drop-show');
    elements.forEach(function (e) {
        e.classList.remove('drop-show');
        e.classList.add('drop-hide');

        var arrow = e.parentElement.querySelector('.slvz-arrow');
        if (arrow) {
            arrow.style.transform = "rotate(0)";
        }
    });
}
function OpenDropList(el) {
    setTimeout(function () {
        var element = el.parentElement.querySelectorAll('.slvz-drop-down-list, .slvz-overflow-menu-list');
        element.forEach((e) => {
            var arrow = el.querySelector('.slvz-arrow');
            if (arrow) {
                arrow.style.transform = "rotate(90deg)";
            }

            e.classList.remove('drop-hide');
            e.classList.add('drop-show');
        });
    }, 50);
}