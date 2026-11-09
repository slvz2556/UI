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






//================= Bottom sheet dialog ==============================
let dialog;
let _dialog_moving = false;
let _dialog_startY = 0, _dialog_delta;
const onDialogMove = e => {
    if (!_dialog_moving)
        return;

    const delta = Math.min(1400, Math.max(0, e.clientY - _dialog_startY));
    dialog.style.transform = 'translateY(' + delta + 'px)';
    _dialog_delta = delta;
};
const onDialogMoveEnd = e => {
    if (!_dialog_moving || !dialog)
        return;

    if (_dialog_delta >= 100) {
        dialog.querySelector('.btn-dialog-done').click();
    } else {

        dialog.style.transition = 'transform 0.3s ease';

        dialog.style.transform = 'translateY(0)';

        setTimeout(() => dialog.style.transition = '', 300);

    }

    _dialog_moving = false;
};
function onDialogDragStart(e, el) {
    dialog = el.parentElement;
    _dialog_startY = e.clientY;
    _dialog_delta = 0;
    _dialog_moving = true;
    dialog.style.transition = '';
}
window.addEventListener("pointermove", onDialogMove);
window.addEventListener("pointerup", onDialogMoveEnd);
window.addEventListener("pointercancel", onDialogMoveEnd);

