function InitializeLayoutDesigner() {
    "use strict";

    var DEVICE_DIMS = {
        desktop: { cols: 12, rows: 8 },
        tablet: { cols: 6, rows: 8 },
        mobile: { cols: 3, rows: 5 }
    };
    var DEVICE_ORDER = ["desktop", "tablet", "mobile"];
    var MEDIA_QUERY = {
        tablet: "@media screen and (max-width: 1024px)",
        mobile: "@media screen and (max-width: 600px)"
    };
    var MAX_SECTIONS = 10;
    var STORAGE_KEY = "slvz-grid-layout-v4";

    /** @type {{id:number, desktop:Placement, tablet:Placement, mobile:Placement}[]} */
    var sections = [];
    var currentDevice = "desktop";
    var activeTab = "html";

    var gridEl = document.getElementById("slvzGrid");
    var frameEl = document.getElementById("deviceFrame");
    var addBtn = document.getElementById("addBtn");
    var resetBtn = document.getElementById("resetBtn");
    var counterEl = document.getElementById("counter");
    var codeOutput = document.getElementById("codeOutput");
    var codeLangLabel = document.getElementById("codeLangLabel");
    var copyBtn = document.getElementById("copyBtn");

    // ---------------- persistence ----------------
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections: sections, device: currentDevice }));
        } catch (err) {
            // TODO(C# bridge): localStorage write failed (quota / disabled / private mode).
            // Forward `err.message` to the native host via your JS-interop bridge
            // (e.g. window.chrome.webview.postMessage) so C# can show a MessageBox.
            console.error("slvz-grid: failed to save state", err);
        }
    }

    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.sections)) {
                sections = parsed.sections;
            }
            if (parsed && parsed.device) {
                currentDevice = parsed.device;
            }
        } catch (err) {
            // TODO(C# bridge): localStorage data was corrupted / unreadable.
            // Forward `err.message` to C# for a MessageBox, then fall back to an empty layout.
            console.error("slvz-grid: failed to load state", err);
            sections = [];
        }
    }

    // ---------------- occupancy / collision (per device) ----------------
    function buildOccupancy(device, excludeId) {
        var dims = DEVICE_DIMS[device];
        var grid = [];
        for (var r = 0; r < dims.rows; r++) { grid.push(new Array(dims.cols).fill(false)); }
        sections.forEach(function (s) {
            if (s.id === excludeId) return;
            var p = s[device];
            if (p.enabled === false) return; // disabled tiles don't occupy space or count
            for (var r = p.row; r < p.row + p.rspan; r++) {
                for (var c = p.col; c < p.col + p.cspan; c++) {
                    if (r >= 1 && r <= dims.rows && c >= 1 && c <= dims.cols) {
                        grid[r - 1][c - 1] = true;
                    }
                }
            }
        });
        return grid;
    }

    function canPlace(device, col, row, cspan, rspan, excludeId) {
        var dims = DEVICE_DIMS[device];
        if (col < 1 || row < 1 || col + cspan - 1 > dims.cols || row + rspan - 1 > dims.rows) return false;
        var occ = buildOccupancy(device, excludeId);
        for (var r = row; r < row + rspan; r++) {
            for (var c = col; c < col + cspan; c++) {
                if (occ[r - 1][c - 1]) return false;
            }
        }
        return true;
    }

    function findFirstFreeCell(device) {
        var dims = DEVICE_DIMS[device];
        var occ = buildOccupancy(device, null);
        for (var r = 1; r <= dims.rows; r++) {
            for (var c = 1; c <= dims.cols; c++) {
                if (!occ[r - 1][c - 1]) return { col: c, row: r };
            }
        }
        return null;
    }

    function nextAvailableNumber() {
        var used = sections.map(function (s) { return s.id; });
        for (var n = 1; n <= MAX_SECTIONS; n++) {
            if (used.indexOf(n) === -1) return n;
        }
        return null;
    }

    // ---------------- rendering ----------------
    function render() {
        var dims = DEVICE_DIMS[currentDevice];
        gridEl.style.setProperty("--cols", dims.cols);
        gridEl.style.setProperty("--rows", dims.rows);
        gridEl.innerHTML = "";

        if (sections.length === 0) {
            var hint = document.createElement("div");
            hint.className = "empty-hint";
            hint.textContent = "Click + Add section to place your first block";
            gridEl.appendChild(hint);
        }

        sections.forEach(function (s) {
            var p = s[currentDevice];
            if (p.enabled === false) return; // hidden on this device — shown in the tray below instead

            var el = document.createElement("div");
            el.className = "slvz-section tile-" + s.id;
            el.dataset.id = s.id;
            el.style.setProperty("--col", p.col);
            el.style.setProperty("--row", p.row);
            el.style.setProperty("--cspan", p.cspan);
            el.style.setProperty("--rspan", p.rspan);
            var hideBtn = currentDevice !== "desktop"
                ? '<div class="hide-toggle" title="Hide on this device">&minus;</div>'
                : '';
            el.innerHTML =
                '<span>Section ' + s.id + '</span>' +
                hideBtn +
                '<div class="remove" title="Remove">&times;</div>' +
                '<div class="resize-handle"></div>';
            gridEl.appendChild(el);

            el.querySelector(".remove").addEventListener("click", function (ev) {
                ev.stopPropagation();
                removeSection(s.id);
            });

            var hideEl = el.querySelector(".hide-toggle");
            if (hideEl) {
                hideEl.addEventListener("click", function (ev) {
                    ev.stopPropagation();
                    hideSection(s.id);
                });
            }

            bindDrag(el, s);
            bindResize(el.querySelector(".resize-handle"), el, s);
        });

        renderHiddenTray();

        counterEl.textContent = sections.length + " / " + MAX_SECTIONS;
        var noRoomAnywhere = DEVICE_ORDER.some(function (dev) { return findFirstFreeCell(dev) === null; });
        addBtn.disabled = sections.length >= MAX_SECTIONS || noRoomAnywhere;

        renderCode();
        saveState();
    }

    function removeSection(id) {
        sections = sections.filter(function (s) { return s.id !== id; });
        render();
    }

    function hideSection(id) {
        if (currentDevice === "desktop") return; // hiding is only available on tablet/mobile
        var s = sections.filter(function (x) { return x.id === id; })[0];
        if (!s) return;
        s[currentDevice].enabled = false;
        render();
    }

    function showSection(id) {
        if (currentDevice === "desktop") return;
        var s = sections.filter(function (x) { return x.id === id; })[0];
        if (!s) return;
        var cell = findFirstFreeCell(currentDevice);
        if (!cell) {
            // TODO(C# bridge): "no free cell to re-enable this section" — forward this
            // message to C# via JS-interop so it can be shown in a native MessageBox.
            alert("No empty cell left on this device to show that section again.");
            return;
        }
        s[currentDevice].col = cell.col;
        s[currentDevice].row = cell.row;
        s[currentDevice].cspan = 1;
        s[currentDevice].rspan = 1;
        s[currentDevice].enabled = true;
        render();
    }

    function renderHiddenTray() {
        var tray = document.getElementById("hiddenTray");
        if (!tray) return;
        tray.innerHTML = "";

        if (currentDevice === "desktop") {
            tray.hidden = true;
            return;
        }

        var hidden = sections.filter(function (s) { return s[currentDevice].enabled === false; });
        if (hidden.length === 0) {
            tray.hidden = true;
            return;
        }

        tray.hidden = false;
        var label = document.createElement("span");
        label.className = "hidden-tray-label";
        label.textContent = "Hidden on this device:";
        tray.appendChild(label);

        hidden.forEach(function (s) {
            var chip = document.createElement("button");
            chip.className = "slvz-button default hidden-chip";
            chip.textContent = "Section " + s.id + " · Show";
            chip.addEventListener("click", function () { showSection(s.id); });
            tray.appendChild(chip);
        });
    }

    // ---------------- add ----------------
    addBtn.addEventListener("click", function () {
        if (sections.length >= MAX_SECTIONS) {
            // TODO(C# bridge): "max sections reached" — forward this message to C#
            // via JS-interop so it can be shown in a native MessageBox instead of alert().
            alert("You can create at most 10 sections.");
            return;
        }
        var id = nextAvailableNumber();
        if (id === null) return; // should be unreachable, guarded above

        var placements = {};
        var ok = true;
        DEVICE_ORDER.forEach(function (dev) {
            var cell = findFirstFreeCell(dev);
            if (!cell) { ok = false; return; }
            placements[dev] = { col: cell.col, row: cell.row, cspan: 1, rspan: 1, enabled: true };
        });

        if (!ok) {
            // TODO(C# bridge): "no free cell in one of the device grids" — forward this
            // message to C# via JS-interop so it can be shown in a native MessageBox.
            alert("One of the device grids (Desktop / Tablet / Mobile) has no empty cell left.");
            return;
        }

        sections.push({ id: id, desktop: placements.desktop, tablet: placements.tablet, mobile: placements.mobile });
        render();
    });

    // ---------------- reset ----------------
    resetBtn.addEventListener("click", function () {
        sections = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            // TODO(C# bridge): localStorage clear failed — forward to C# for a MessageBox.
            console.error("slvz-grid: failed to clear storage", err);
        }
        render();
    });

    // ---------------- device switch ----------------
    document.getElementById("deviceSwitch").addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-device]");
        if (!btn) return;
        currentDevice = btn.dataset.device;
        frameEl.dataset.device = currentDevice;
        Array.prototype.forEach.call(
            document.querySelectorAll("#deviceSwitch .slvz-button"),
            function (b) { b.classList.toggle("primary", b === btn); }
        );
        render();
    });

    // ---------------- drag ----------------
    function bindDrag(el, s) {
        el.addEventListener("mousedown", function (ev) {
            if (ev.target.closest(".resize-handle") || ev.target.closest(".remove") || ev.target.closest(".hide-toggle")) return;
            startDrag(ev.clientX, ev.clientY, el, s);
            ev.preventDefault();
        });
        el.addEventListener("touchstart", function (ev) {
            if (ev.target.closest(".resize-handle") || ev.target.closest(".remove") || ev.target.closest(".hide-toggle")) return;
            var t = ev.touches[0];
            startDrag(t.clientX, t.clientY, el, s);
            ev.preventDefault();
        }, { passive: false });
    }

    function startDrag(startX, startY, el, s) {
        var device = currentDevice;
        var p = s[device];
        var dims = DEVICE_DIMS[device];
        var rect = gridEl.getBoundingClientRect();
        var cellW = rect.width / dims.cols;
        var cellH = rect.height / dims.rows;
        var startCol = p.col, startRow = p.row;
        el.classList.add("dragging");

        function move(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            var deltaCols = Math.round(dx / cellW);
            var deltaRows = Math.round(dy / cellH);
            var targetCol = startCol + deltaCols;
            var targetRow = startRow + deltaRows;
            targetCol = Math.max(1, Math.min(dims.cols - p.cspan + 1, targetCol));
            targetRow = Math.max(1, Math.min(dims.rows - p.rspan + 1, targetRow));

            if ((targetCol !== p.col || targetRow !== p.row) &&
                canPlace(device, targetCol, targetRow, p.cspan, p.rspan, s.id)) {
                p.col = targetCol;
                p.row = targetRow;
                el.style.setProperty("--col", p.col);
                el.style.setProperty("--row", p.row);
            }
        }

        function onMouseMove(ev) { move(ev.clientX, ev.clientY); }
        function onTouchMove(ev) {
            var t = ev.touches[0];
            move(t.clientX, t.clientY);
            ev.preventDefault();
        }
        function stop() {
            el.classList.remove("dragging");
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", stop);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", stop);
            renderCode();
            saveState();
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", stop);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", stop);
    }

    // ---------------- resize ----------------
    function bindResize(handle, el, s) {
        handle.addEventListener("mousedown", function (ev) {
            startResize(ev.clientX, ev.clientY, el, s);
            ev.stopPropagation();
            ev.preventDefault();
        });
        handle.addEventListener("touchstart", function (ev) {
            var t = ev.touches[0];
            startResize(t.clientX, t.clientY, el, s);
            ev.stopPropagation();
            ev.preventDefault();
        }, { passive: false });
    }

    function startResize(startX, startY, el, s) {
        var device = currentDevice;
        var p = s[device];
        var dims = DEVICE_DIMS[device];
        var rect = gridEl.getBoundingClientRect();
        var cellW = rect.width / dims.cols;
        var cellH = rect.height / dims.rows;
        var startCspan = p.cspan, startRspan = p.rspan;

        function move(clientX, clientY) {
            var dx = clientX - startX;
            var dy = clientY - startY;
            var deltaCols = Math.round(dx / cellW);
            var deltaRows = Math.round(dy / cellH);
            var targetCspan = Math.max(1, Math.min(dims.cols - p.col + 1, startCspan + deltaCols));
            var targetRspan = Math.max(1, Math.min(dims.rows - p.row + 1, startRspan + deltaRows));

            if ((targetCspan !== p.cspan || targetRspan !== p.rspan) &&
                canPlace(device, p.col, p.row, targetCspan, targetRspan, s.id)) {
                p.cspan = targetCspan;
                p.rspan = targetRspan;
                el.style.setProperty("--cspan", p.cspan);
                el.style.setProperty("--rspan", p.rspan);
            }
        }

        function onMouseMove(ev) { move(ev.clientX, ev.clientY); }
        function onTouchMove(ev) {
            var t = ev.touches[0];
            move(t.clientX, t.clientY);
            ev.preventDefault();
        }
        function stop() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", stop);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", stop);
            renderCode();
            saveState();
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", stop);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", stop);
    }

    // ---------------- code generation (raw, exportable, responsive) ----------------
    function generateHTML() {
        var lines = [];
        lines.push('<div class="slvz-grid">');
        sections
            .slice()
            .sort(function (a, b) { return a.id - b.id; })
            .forEach(function (s) {
                lines.push('  <div class="slvz-section tile-' + s.id + '">Section ' + s.id + '</div>');
            });
        lines.push('</div>');
        return lines.join("\n");
    }

    // NOTE: the guide dots (--svg-light-fill) are an editor-only aid and are
    // intentionally NOT written into the exported CSS below.
    function gridRuleLines(device, isBase) {
        var dims = DEVICE_DIMS[device];
        var lines = [];
        lines.push(".slvz-grid {");
        if (isBase) {
            lines.push("  display: grid;");
            lines.push("  width: 100%;");
            lines.push("  height: 100vh;");
        }
        lines.push("  grid-template-columns: repeat(" + dims.cols + ", 1fr);");
        lines.push("  grid-template-rows: repeat(" + dims.rows + ", 1fr);");
        lines.push("}");
        return lines;
    }

    function sectionRuleLines(device) {
        var lines = [];
        sections
            .slice()
            .sort(function (a, b) { return a.id - b.id; })
            .forEach(function (s) {
                var p = s[device];
                lines.push(".tile-" + s.id + " {");
                if (p.enabled === false) {
                    lines.push("  display: none;");
                } else {
                    lines.push("  grid-column: " + p.col + " / span " + p.cspan + ";");
                    lines.push("  grid-row: " + p.row + " / span " + p.rspan + ";");
                }
                lines.push("}");
            });
        return lines;
    }

    function generateCSS() {
        var lines = [];

        // base (desktop) rules — no media query
        lines = lines.concat(gridRuleLines("desktop", true));
        lines.push("");
        lines = lines.concat(sectionRuleLines("desktop"));

        // tablet + mobile overrides, fully responsive
        ["tablet", "mobile"].forEach(function (device) {
            if (sections.length === 0) return;
            lines.push("");
            lines.push(MEDIA_QUERY[device] + " {");
            gridRuleLines(device, false).forEach(function (l) { lines.push("  " + l); });
            lines.push("");
            sectionRuleLines(device).forEach(function (l) { lines.push("  " + l); });
            lines.push("}");
        });

        return lines.join("\n");
    }

    function renderCode() {
        codeOutput.textContent = activeTab === "html" ? generateHTML() : generateCSS();
        codeOutput.removeAttribute('class');
        codeOutput.classList.add(activeTab === "html" ? "language-html" : "language-css");
        codeOutput.removeAttribute('data-highlighted');
        hljs.highlightAll();
        codeLangLabel.textContent = activeTab;
    }

    document.querySelector(".tabs").addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-tab]");
        if (!btn) return;
        activeTab = btn.dataset.tab;
        Array.prototype.forEach.call(
            document.querySelectorAll(".tabs .slvz-button"),
            function (b) { b.classList.toggle("primary", b === btn); }
        );
        renderCode();
    });

    copyBtn.addEventListener("click", async function () {
        var text = codeOutput.textContent;
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            var ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        var label = copyBtn.querySelector(".copy-label");
        var original = label.textContent;
        label.textContent = "Copied";
        copyBtn.classList.add("copied");
        setTimeout(function () {
            label.textContent = original;
            copyBtn.classList.remove("copied");
        }, 1800);
    });

    // ---------------- init ----------------
    loadState();
    frameEl.dataset.device = currentDevice;
    Array.prototype.forEach.call(
        document.querySelectorAll("#deviceSwitch .slvz-button"),
        function (b) { b.classList.toggle("primary", b.dataset.device === currentDevice); }
    );
    render();
}
