document.querySelector('body').addEventListener('click', () => {
    CloseDropDownList();
});





//================= Drop down list ==============================
function CloseDropDownList() {
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
function OpenDropDownList(el) {
    setTimeout(function () {
        var element = el.parentElement.querySelector('.slvz-drop-down-list');

        var arrow = el.querySelector('.slvz-arrow');
        if (arrow) {
            arrow.style.transform = "rotate(90deg)";
        }

        element.classList.remove('drop-hide');
        element.classList.add('drop-show');
    }, 50);
}