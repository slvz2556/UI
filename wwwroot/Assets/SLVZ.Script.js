document.querySelector('body').addEventListener('click', () => {
    CloseDropDownList();
});

function CloseDropDownList() {
    var elements = document.querySelectorAll('.drop-show');
    elements.forEach(function (e) {
        e.classList.remove('drop-show');
        e.classList.add('drop-hide');
    });
}

function OpenDropDownList(el) {
    setTimeout(function () {
        var element = el.parentElement.querySelector('.slvz-drop-down-list');
        element.classList.remove('drop-hide');
        element.classList.add('drop-show');
    }, 50);
}