window.SLVZColorPicker = {
    // Called from C# inside the pointerdown handler (bound in the .razor
    // markup itself), i.e. only exactly when the user starts dragging
    // that specific element — never before.
    capture: function (element, pointerId) {
        try {
            if (element && element.setPointerCapture) {
                element.setPointerCapture(pointerId);
            }
        } catch (err) {
        }
    },

    // Called from C# inside the pointerup/pointercancel handler.
    release: function (element, pointerId) {
        try {
            if (element && element.hasPointerCapture && element.hasPointerCapture(pointerId)) {
                element.releasePointerCapture(pointerId);
            }
        } catch (err) {
        }
    }
};
