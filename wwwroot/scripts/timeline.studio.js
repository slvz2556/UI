window.TimelineStudio = (function () {

    // Everything is looked up inside the studio's own <main>, so ids can't clash with the host page.
    let root = null;
    const $ = (id) => root.querySelector('#' + id);

    const TRACK_DEFS = {
        x: { label: 'X', unit: 'px', def: 0, color: 'var(--track-x)', kind: 'transform', core: true },
        y: { label: 'Y', unit: 'px', def: 0, color: 'var(--track-y)', kind: 'transform', core: true },
        scale: { label: 'Scale', unit: '', def: 1, color: 'var(--track-scale)', kind: 'transform', core: true },
        rotate: { label: 'Rotate', unit: 'deg', def: 0, color: 'var(--track-rotate)', kind: 'transform', core: true },
        rotateX: { label: 'Rotate X', unit: 'deg', def: 0, color: 'var(--track-rotateX)', kind: 'transform' },
        rotateY: { label: 'Rotate Y', unit: 'deg', def: 0, color: 'var(--track-rotateY)', kind: 'transform' },
        opacity: { label: 'Opacity', unit: '', def: 1, color: 'var(--track-opacity)', kind: 'style' },
        width: { label: 'Width', unit: 'px', def: 100, color: 'var(--track-width)', kind: 'style' },
        height: { label: 'Height', unit: 'px', def: 100, color: 'var(--track-height)', kind: 'style' },
        borderRadius: { label: 'Corner radius', unit: 'px', def: 0, color: 'var(--track-borderRadius)', kind: 'style' },
        color: { label: 'Color', unit: '', def: '#ff7a45', color: 'var(--track-color)', kind: 'color' },
    };
    let PALETTE = ['#6742bc', '#bc4274', '#42bc8a', '#bc9c42', '#4274bc', '#8abc42', '#bc5a42', '#42a8bc'];
    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        const x = v => Math.round(255 * v).toString(16).padStart(2, '0');
        return '#' + x(f(0)) + x(f(8)) + x(f(4));
    }
    // Builds the element colour palette from the host project's --primary-hue/--primary-sat/--primary-light.
    function buildPalette() {
        const cs = getComputedStyle(root);
        const h = parseFloat(cs.getPropertyValue('--primary-hue'));
        const s = parseFloat(cs.getPropertyValue('--primary-sat'));
        const l = parseFloat(cs.getPropertyValue('--primary-light'));
        if (isNaN(h)) return;
        const sat = Math.max(isNaN(s) ? 55 : s, 55), lig = isNaN(l) ? 50 : Math.min(Math.max(l, 42), 58);
        PALETTE = [0, 45, 90, 150, 200, 250, 300, 340].map(o => hslToHex((h + o) % 360, sat, lig));
    }
    const STAGE_MAX = 1500; // max stage width/height in px

    let state = {
        duration: 5000,
        playhead: 0,
        elements: [],
        selectedElementId: null,
        selectedTrack: null,
        selectedKfIndex: null,
        nextId: 1,
        playing: false,
        stage: { width: 854, height: 480 },
        canvasZoom: 1,
        canvasPan: { x: 0, y: 0 },
    };

    const PX_PER_MS = 1.0; // timeline horizontal scale — ~1000ms visible per viewport width

    // ---------- persistence ----------
    function save() {
        try { localStorage.setItem('timelineStudioProject', JSON.stringify(state)); } catch (e) { }
    }
    function load() {
        try {
            const raw = localStorage.getItem('timelineStudioProject');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.elements) { state = Object.assign(state, parsed); }
            }
        } catch (e) { }
    }

    // ---------- helpers ----------
    function uid(prefix) { return prefix + (state.nextId++); }
    function getEl(id) { return state.elements.find(e => e.id === id); }
    function selectedEl() { return getEl(state.selectedElementId); }

    function easeFn(easing) {
        switch (easing) {
            case 'ease': return t => cubicBezier(0.25, 0.1, 0.25, 1, t);
            case 'ease-in': return t => cubicBezier(0.42, 0, 1, 1, t);
            case 'ease-out': return t => cubicBezier(0, 0, 0.58, 1, t);
            case 'ease-in-out': return t => cubicBezier(0.42, 0, 0.58, 1, t);
            case 'linear': return t => t;
            default: return null; // custom handled separately
        }
    }
    function cubicBezier(x1, y1, x2, y2, t) {
        // Newton-Raphson approximation for cubic bezier easing
        function bez(a, b, c, tt) { return 3 * a * (1 - tt) * (1 - tt) * tt + 3 * b * (1 - tt) * tt * tt + c * tt * tt * tt; }
        let tt = t;
        for (let i = 0; i < 6; i++) {
            const xEst = bez(x1, x2, 1, tt) - t;
            const d = 3 * (1 - tt) * (1 - tt) * x1 + 6 * (1 - tt) * tt * (x2 - x1) + 3 * tt * tt * (1 - x2);
            if (Math.abs(d) < 1e-6) break;
            tt -= xEst / d;
            tt = Math.min(1, Math.max(0, tt));
        }
        return bez(y1, y2, 1, tt);
    }
    function applyEasing(kf, t) {
        if (kf.easing === 'custom' && kf.bezier) {
            return cubicBezier(kf.bezier[0], kf.bezier[1], kf.bezier[2], kf.bezier[3], t);
        }
        const fn = easeFn(kf.easing || 'linear');
        return fn ? fn(t) : t;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpColor(c1, c2, t) {
        const p1 = hexToRgb(c1), p2 = hexToRgb(c2);
        const r = Math.round(lerp(p1.r, p2.r, t)), g = Math.round(lerp(p1.g, p2.g, t)), b = Math.round(lerp(p1.b, p2.b, t));
        return `rgb(${r},${g},${b})`;
    }
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function trackValueAt(track, timeMs, def) {
        const kfs = track.keyframes;
        if (!kfs.length) return def;
        if (kfs.length === 1) return kfs[0].value;
        let t = timeMs;
        if (track.loop) {
            const first = kfs[0].time, last = kfs[kfs.length - 1].time;
            const span = last - first;
            if (span > 0) { t = first + ((((timeMs - first) % span) + span) % span); }
        }
        if (t <= kfs[0].time) return kfs[0].value;
        if (t >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
        for (let i = 0; i < kfs.length - 1; i++) {
            const a = kfs[i], b = kfs[i + 1];
            if (t >= a.time && t <= b.time) {
                const frac = b.time === a.time ? 0 : (t - a.time) / (b.time - a.time);
                const eased = applyEasing(a, frac);
                return track.isColor ? lerpColor(a.value, b.value, eased) : lerp(a.value, b.value, eased);
            }
        }
        return kfs[kfs.length - 1].value;
    }

    // ---------- element ops ----------
    function addElement() {
        const id = uid('el');
        const color = PALETTE[(state.elements.length) % PALETTE.length];
        const cx = 140 + (state.elements.length % 5) * 20, cy = 100 + (state.elements.length % 5) * 20;
        const el = {
            id, name: 'Element ' + state.elements.length, color,
            tracks: {
                x: { keyframes: [{ time: 0, value: cx, easing: 'linear' }], loop: false, isColor: false },
                y: { keyframes: [{ time: 0, value: cy, easing: 'linear' }], loop: false, isColor: false },
                rotate: { keyframes: [{ time: 0, value: 0, easing: 'linear' }], loop: false, isColor: false },
                scale: { keyframes: [{ time: 0, value: 1, easing: 'linear' }], loop: false, isColor: false },
            }
        };
        state.elements.push(el);
        state.selectedElementId = id;
        renderAll(); save();
    }
    function duplicateElement(id) {
        const src = getEl(id); if (!src) return;
        const clone = JSON.parse(JSON.stringify(src));
        clone.id = uid('el');
        clone.name = src.name + ' copy';
        if (clone.tracks.x) clone.tracks.x.keyframes.forEach(k => k.value += 20);
        if (clone.tracks.y) clone.tracks.y.keyframes.forEach(k => k.value += 20);
        state.elements.push(clone);
        state.selectedElementId = clone.id;
        state.selectedTrack = null; state.selectedKfIndex = null;
        renderAll(); save();
    }
    function deleteElement(id) {
        state.elements = state.elements.filter(e => e.id !== id);
        if (state.selectedElementId === id) state.selectedElementId = state.elements[0]?.id || null;
        renderAll(); save();
    }
    function addTrackToSelected(trackKey) {
        const el = selectedEl(); if (!el) return;
        if (el.tracks[trackKey]) return;
        const def = TRACK_DEFS[trackKey];
        el.tracks[trackKey] = {
            keyframes: [{ time: state.playhead, value: def.kind === 'color' ? el.color : def.def, easing: 'linear' }],
            loop: false, isColor: def.kind === 'color'
        };
        renderAll(); save();
    }
    function removeTrack(trackKey) {
        const el = selectedEl(); if (!el) return;
        delete el.tracks[trackKey];
        if (state.selectedTrack === trackKey) { state.selectedTrack = null; state.selectedKfIndex = null; }
        renderAll(); save();
    }

    // ---------- keyframe ops ----------
    function addKeyframeAt(trackKey, timeMs) {
        const el = selectedEl(); if (!el) return;
        const track = el.tracks[trackKey]; if (!track) return;
        const def = TRACK_DEFS[trackKey];
        const existing = track.keyframes.find(k => Math.abs(k.time - timeMs) < 40);
        if (existing) { selectKeyframe(trackKey, track.keyframes.indexOf(existing)); return; }
        const val = trackValueAt(track, timeMs, def.def);
        track.keyframes.push({ time: Math.round(timeMs / 10) * 10, value: val, easing: 'linear' });
        track.keyframes.sort((a, b) => a.time - b.time);
        selectKeyframe(trackKey, track.keyframes.findIndex(k => Math.abs(k.time - timeMs) < 40));
        renderAll(); save();
    }
    function selectKeyframe(trackKey, idx) {
        state.selectedTrack = trackKey; state.selectedKfIndex = idx;
        renderInspector(); renderTimeline();
    }
    function deleteSelectedKeyframe() {
        const el = selectedEl(); if (!el || state.selectedTrack == null) return;
        const track = el.tracks[state.selectedTrack];
        track.keyframes.splice(state.selectedKfIndex, 1);
        state.selectedTrack = null; state.selectedKfIndex = null;
        renderAll(); save();
    }

    // ---------- rendering ----------
    let elListEl;
    let canvasEl;
    let trackLabelsEl;
    let tracksAreaEl;
    let rulerEl;
    let playheadEl, playheadHeadEl;
    let timeLabelEl;
    let trackSelectEl;
    let trackSelectDD, easingDD;
    const dropdowns = [];

    // Dropdown with its own .ts-dropdown classes (no clash with host styles). Mimics a <select>: .value, setOptions(), onChange.
    const ARROW_SVG = '<svg class="ts-dropdown-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function clampStage(v, fallback) {
        const n = parseInt(v);
        return Math.min(STAGE_MAX, Math.max(10, isNaN(n) ? fallback : n));
    }
    function Dropdown(host, onChange) {
        host.classList.add('ts-dropdown');
        host.innerHTML = '<div class="ts-dropdown-body"><span></span>' + ARROW_SVG + '</div><div class="ts-dropdown-list ts-hide"></div>';
        const body = host.children[0], label = body.querySelector('span'), list = host.children[1];
        const dd = {
            host, options: [], _value: '', placeholder: '',
            get value() { return this._value; },
            set value(v) {
                this._value = v;
                const o = this.options.find(x => x.value === v);
                label.textContent = o ? o.label : this.placeholder;
                list.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b.dataset.value === v));
            },
            setOptions(opts, placeholder) {
                this.options = opts; this.placeholder = placeholder || '';
                list.innerHTML = '';
                opts.forEach(o => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.className = 'ts-dropdown-item'; b.dataset.value = o.value; b.textContent = o.label;
                    b.addEventListener('click', (e) => { e.stopPropagation(); this.value = o.value; this.close(); if (onChange) onChange(o.value); });
                    list.appendChild(b);
                });
                host.classList.toggle('disabled', opts.length === 0);
                this.value = opts.some(x => x.value === this._value) ? this._value : (opts[0] ? opts[0].value : '');
            },
            open() { dropdowns.forEach(d => { if (d !== dd) d.close(); }); host.classList.add('open'); list.classList.replace('ts-hide', 'ts-show'); },
            close() { host.classList.remove('open'); list.classList.replace('ts-show', 'ts-hide'); },
        };
        body.addEventListener('click', () => { host.classList.contains('open') ? dd.close() : dd.open(); });
        dropdowns.push(dd);
        return dd;
    }
    let inspectorEl;
    let timelineScrollInner;
    let tracksScrollEl;

    function renderElList() {
        elListEl.innerHTML = '';
        if (!state.elements.length) {
            const p = document.createElement('div');
            p.className = 'hint'; p.style.padding = '6px 0';
            p.textContent = 'No elements yet. Click "Add Element" above.';
            elListEl.appendChild(p);
        }
        state.elements.forEach(el => {
            const row = document.createElement('div');
            row.className = 'elRow' + (el.id === state.selectedElementId ? ' active' : '');
            row.innerHTML = `<span class="elSwatch" style="background:${el.color}"></span>
        <input class="elName" value="${el.name}">
        <button class="elDup" title="Duplicate">⧉</button>
        <button class="elDel" title="Delete">✕</button>`;
            row.querySelector('.elName').addEventListener('click', e => e.stopPropagation());
            row.querySelector('.elName').addEventListener('change', e => { el.name = e.target.value; save(); });
            row.querySelector('.elDup').addEventListener('click', e => { e.stopPropagation(); duplicateElement(el.id); });
            row.querySelector('.elDel').addEventListener('click', e => { e.stopPropagation(); deleteElement(el.id); });
            row.addEventListener('click', () => { state.selectedElementId = el.id; state.selectedTrack = null; state.selectedKfIndex = null; renderAll(); });
            elListEl.appendChild(row);
        });
    }

    function applyStageSize() {
        canvasEl.style.width = state.stage.width + 'px';
        canvasEl.style.height = state.stage.height + 'px';
        canvasEl.style.transform = `translate(${state.canvasPan.x}px,${state.canvasPan.y}px) scale(${state.canvasZoom})`;
    }

    function renderCanvas() {
        applyStageSize();
        const existing = {};
        Array.from(canvasEl.children).forEach(c => { if (c.dataset && c.dataset.id) existing[c.dataset.id] = c; });
        const seen = new Set();
        state.elements.forEach(el => {
            seen.add(el.id);
            let div = existing[el.id];
            if (!div) {
                div = document.createElement('div');
                div.className = 'el';
                div.dataset.id = el.id;
                div.style.touchAction = 'none';
                div.addEventListener('pointerdown', (e) => startDragElement(e, el.id));
                div.addEventListener('click', (e) => { e.stopPropagation(); state.selectedElementId = el.id; renderAll(); });
                canvasEl.appendChild(div);
            }
            div.classList.toggle('selected', el.id === state.selectedElementId);
            div.querySelectorAll('.handle').forEach(h => h.remove());
            if (el.id === state.selectedElementId) {
                const rot = document.createElement('div');
                rot.className = 'handle rotHandle'; rot.title = 'Drag to rotate';
                rot.addEventListener('pointerdown', (e) => { e.stopPropagation(); startRotateHandle(e, el.id); });
                div.appendChild(rot);
                const scl = document.createElement('div');
                scl.className = 'handle scaleHandle'; scl.title = 'Drag to scale';
                scl.addEventListener('pointerdown', (e) => { e.stopPropagation(); startScaleHandle(e, el.id); });
                div.appendChild(scl);
                const rsz = document.createElement('div');
                rsz.className = 'handle resizeHandle'; rsz.title = 'Drag to resize (width/height)';
                rsz.addEventListener('pointerdown', (e) => { e.stopPropagation(); startResizeHandle(e, el.id); });
                div.appendChild(rsz);
            }
        });
        Object.keys(existing).forEach(id => { if (!seen.has(id)) existing[id].remove(); });
        applyFrame(state.playhead);
    }

    function applyFrame(timeMs) {
        state.elements.forEach(el => {
            const div = canvasEl.querySelector(`[data-id="${el.id}"]`);
            if (!div) return;
            const x = el.tracks.x ? trackValueAt(el.tracks.x, timeMs, 0) : 0;
            const y = el.tracks.y ? trackValueAt(el.tracks.y, timeMs, 0) : 0;
            const scale = el.tracks.scale ? trackValueAt(el.tracks.scale, timeMs, 1) : 1;
            const rotate = el.tracks.rotate ? trackValueAt(el.tracks.rotate, timeMs, 0) : 0;
            const rotateX = el.tracks.rotateX ? trackValueAt(el.tracks.rotateX, timeMs, 0) : 0;
            const rotateY = el.tracks.rotateY ? trackValueAt(el.tracks.rotateY, timeMs, 0) : 0;
            const opacity = el.tracks.opacity ? trackValueAt(el.tracks.opacity, timeMs, 1) : 1;
            const width = el.tracks.width ? trackValueAt(el.tracks.width, timeMs, 100) : 100;
            const height = el.tracks.height ? trackValueAt(el.tracks.height, timeMs, 100) : 100;
            const radius = el.tracks.borderRadius ? trackValueAt(el.tracks.borderRadius, timeMs, 0) : 0;
            div.style.width = width + 'px';
            div.style.height = height + 'px';
            div.style.borderRadius = radius + 'px';
            div.style.opacity = opacity;
            div.style.transform = `translate(${x}px,${y}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotate}deg)`;
            const centerX = x + width / 2, centerY = y + height / 2;
            const halfW = (width * scale) / 2, halfH = (height * scale) / 2;
            const outside = (centerX - halfW < 0) || (centerY - halfH < 0) ||
                (centerX + halfW > state.stage.width) || (centerY + halfH > state.stage.height);
            div.classList.toggle('out-of-frame', outside);
            if (el.tracks.color) {
                div.style.background = trackValueAt(el.tracks.color, timeMs, el.color);
                div.querySelector && (div.style.background = trackValueAt(el.tracks.color, timeMs, el.color));
            } else {
                div.style.background = el.color;
            }
        });
    }

    function renderTrackSelect() {
        const el = selectedEl();
        const available = Object.keys(TRACK_DEFS).filter(k => !el || !el.tracks[k]);
        if (!el || available.length === 0) {
            trackSelectDD.setOptions([], el ? 'All properties added' : 'Select an element first');
            $('addTrackBtn').disabled = true;
            return;
        }
        $('addTrackBtn').disabled = false;
        trackSelectDD.setOptions(available.map(k => ({ value: k, label: TRACK_DEFS[k].label })));
    }

    function timeToPx(t) { return t * PX_PER_MS; }
    function pxToTime(px) { return Math.max(0, Math.min(state.duration, px / PX_PER_MS)); }

    function renderRuler() {
        const totalPx = timeToPx(state.duration);
        rulerEl.style.width = totalPx + 'px';
        rulerEl.innerHTML = '';
        const step = state.duration > 12000 ? 2000 : state.duration > 4000 ? 1000 : 500;
        for (let t = 0; t <= state.duration; t += step) {
            const tick = document.createElement('div');
            tick.className = 'rulerTick';
            tick.style.left = timeToPx(t) + 'px';
            tick.style.width = timeToPx(step) + 'px';
            tick.textContent = t + 'ms';
            rulerEl.appendChild(tick);
        }
    }

    function renderTimeline() {
        const el = selectedEl();
        trackLabelsEl.innerHTML = ''; tracksAreaEl.innerHTML = '';
        const rulerSpacer = document.createElement('div');
        rulerSpacer.style.cssText = 'height:24px;position:sticky;top:0;z-index:3;background:var(--card-background);border-bottom:1px solid var(--line);';
        trackLabelsEl.appendChild(rulerSpacer);
        const totalPx = timeToPx(state.duration);
        tracksAreaEl.style.width = totalPx + 'px';
        timelineScrollInner.style.width = totalPx + 'px';

        if (!el) {
            const msg = document.createElement('div'); msg.id = 'emptyTimelineMsg';
            msg.textContent = 'Select an element from the right panel or the stage to see its tracks here.';
            tracksAreaEl.appendChild(msg);
            renderRuler();
            positionPlayhead();
            syncLabels();
            return;
        }

        const keys = Object.keys(el.tracks);
        if (!keys.length) {
            const msg = document.createElement('div'); msg.id = 'emptyTimelineMsg';
            msg.textContent = 'This element has no animated properties yet — add one from the right panel.';
            tracksAreaEl.appendChild(msg);
        }

        keys.forEach(key => {
            const def = TRACK_DEFS[key];
            const track = el.tracks[key];

            const labelRow = document.createElement('div');
            labelRow.className = 'trackLabelRow';
            labelRow.innerHTML = `<span class="dot" style="background:${def.color}"></span>
        <span class="tname">${def.label}</span>
        <button class="loopBtn ${track.loop ? 'on' : ''}" title="Loop">⟲</button>
        ${def.core ? '' : '<button class="rmBtn" title="Remove property">✕</button>'}`;
            labelRow.querySelector('.loopBtn').addEventListener('click', () => { track.loop = !track.loop; renderAll(); save(); });
            const rmB = labelRow.querySelector('.rmBtn');
            if (rmB) rmB.addEventListener('click', () => removeTrack(key));
            trackLabelsEl.appendChild(labelRow);

            const row = document.createElement('div');
            row.className = 'trackRow';
            row.style.width = totalPx + 'px';
            row.addEventListener('click', (e) => {
                if (e.target !== row) return;
                const rect = row.getBoundingClientRect();
                const px = e.clientX - rect.left;
                addKeyframeAt(key, pxToTime(px));
            });

            // connecting lines
            for (let i = 0; i < track.keyframes.length - 1; i++) {
                const a = track.keyframes[i], b = track.keyframes[i + 1];
                const line = document.createElement('div');
                line.className = 'kfLine';
                line.style.left = timeToPx(a.time) + 'px';
                line.style.width = (timeToPx(b.time) - timeToPx(a.time)) + 'px';
                row.appendChild(line);
            }
            track.keyframes.forEach((kf, idx) => {
                const dot = document.createElement('div');
                dot.className = 'kf' + ((state.selectedTrack === key && state.selectedKfIndex === idx) ? ' selected' : '');
                dot.style.left = timeToPx(kf.time) + 'px';
                dot.style.background = def.color;
                dot.addEventListener('mousedown', (e) => { e.stopPropagation(); startDragKeyframe(e, key, idx); });
                dot.addEventListener('click', (e) => { e.stopPropagation(); selectKeyframe(key, idx); });
                row.appendChild(dot);
            });

            tracksAreaEl.appendChild(row);
        });

        renderRuler();
        positionPlayhead();
        syncLabels();
    }

    // Extra room under the labels (>= the horizontal scrollbar) so they can always reach the same scrollTop as the rows.
    function syncLabels() {
        const pad = document.createElement('div');
        pad.style.cssText = 'height:16px;';
        trackLabelsEl.appendChild(pad);
        trackLabelsEl.scrollTop = tracksScrollEl.scrollTop;
    }

    function positionPlayhead() {
        playheadEl.style.left = timeToPx(state.playhead) + 'px';
        playheadHeadEl.style.left = (timeToPx(state.playhead) - 5) + 'px';
        timeLabelEl.textContent = Math.round(state.playhead) + ' / ' + state.duration + 'ms';
    }

    function renderInspector() {
        const el = selectedEl();
        if (!el || state.selectedTrack == null || state.selectedKfIndex == null) {
            inspectorEl.classList.remove('show'); return;
        }
        const track = el.tracks[state.selectedTrack];
        const kf = track.keyframes[state.selectedKfIndex];
        if (!kf) { inspectorEl.classList.remove('show'); return; }
        inspectorEl.classList.add('show');
        $('kfTime').value = kf.time;
        easingDD.value = kf.easing || 'linear';
        const isColor = track.isColor;
        $('kfColorRow').style.display = isColor ? 'flex' : 'none';
        $('kfValueNum').closest('.row').style.display = isColor ? 'none' : 'flex';
        if (isColor) { $('kfValueColor').value = kf.value; }
        else { $('kfValueNum').value = kf.value; }
        $('kfBezierRow').style.display = kf.easing === 'custom' ? 'flex' : 'none';
        if (kf.bezier) {
            $('bz1').value = kf.bezier[0];
            $('bz2').value = kf.bezier[1];
            $('bz3').value = kf.bezier[2];
            $('bz4').value = kf.bezier[3];
        }
    }

    function renderAll() {
        renderElList();
        renderCanvas();
        renderTrackSelect();
        renderTimeline();
        renderInspector();
    }

    // ---------- dragging elements on canvas (mouse + touch via Pointer Events) ----------
    function startDragElement(e, id) {
        e.preventDefault(); e.stopPropagation();
        state.selectedElementId = id; renderAll();
        const el = getEl(id);
        const div = canvasEl.querySelector(`[data-id="${id}"]`);
        const startX = trackValueAt(el.tracks.x || { keyframes: [{ time: 0, value: 0 }] }, state.playhead, 0);
        const startY = trackValueAt(el.tracks.y || { keyframes: [{ time: 0, value: 0 }] }, state.playhead, 0);
        const startMouse = { x: e.clientX, y: e.clientY };
        const pointerId = e.pointerId;
        div && div.setPointerCapture && div.setPointerCapture(pointerId);
        function onMove(ev) {
            const dx = (ev.clientX - startMouse.x) / state.canvasZoom, dy = (ev.clientY - startMouse.y) / state.canvasZoom;
            let newX = startX + dx, newY = startY + dy;
            if (ev.shiftKey) { newX = Math.round(newX / 10) * 10; newY = Math.round(newY / 10) * 10; }
            setValueAtPlayhead('x', newX);
            setValueAtPlayhead('y', newY);
            applyFrame(state.playhead);
            updateGuides(id);
        }
        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            clearGuides();
            renderAll(); save();
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    // ---------- alignment guides (Illustrator-style smart guides) ----------
    let guidesEl;
    function elBoxAt(el, t) {
        const x = el.tracks.x ? trackValueAt(el.tracks.x, t, 0) : 0;
        const y = el.tracks.y ? trackValueAt(el.tracks.y, t, 0) : 0;
        const w = el.tracks.width ? trackValueAt(el.tracks.width, t, 100) : 100;
        const h = el.tracks.height ? trackValueAt(el.tracks.height, t, 100) : 100;
        return { left: x, right: x + w, top: y, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
    }
    function updateGuides(draggedId) {
        const el = getEl(draggedId); if (!el) return;
        const t = state.playhead;
        const box = elBoxAt(el, t);
        const TOL = 3;
        const vSet = new Set(), hSet = new Set();
        state.elements.forEach(o => {
            if (o.id === draggedId) return;
            const ob = elBoxAt(o, t);
            [[box.left, ob.left], [box.right, ob.right], [box.cx, ob.cx], [box.left, ob.right], [box.right, ob.left]].forEach(([a, b]) => {
                if (Math.abs(a - b) < TOL) vSet.add(Math.round(b));
            });
            [[box.top, ob.top], [box.bottom, ob.bottom], [box.cy, ob.cy], [box.top, ob.bottom], [box.bottom, ob.top]].forEach(([a, b]) => {
                if (Math.abs(a - b) < TOL) hSet.add(Math.round(b));
            });
        });
        guidesEl.innerHTML = '';
        vSet.forEach(vx => {
            const l = document.createElement('div'); l.className = 'guideLine guideV'; l.style.left = vx + 'px'; guidesEl.appendChild(l);
        });
        hSet.forEach(hy => {
            const l = document.createElement('div'); l.className = 'guideLine guideH'; l.style.top = hy + 'px'; guidesEl.appendChild(l);
        });
    }
    function clearGuides() { guidesEl.innerHTML = ''; }

    function startRotateHandle(e, id) {
        e.preventDefault();
        const el = getEl(id);
        const div = canvasEl.querySelector(`[data-id="${id}"]`);
        const rect = div.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        const startRotate = trackValueAt(el.tracks.rotate || { keyframes: [{ time: 0, value: 0 }] }, state.playhead, 0);
        const pointerId = e.pointerId;
        e.target.setPointerCapture && e.target.setPointerCapture(pointerId);
        function onMove(ev) {
            const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
            let newRotate = startRotate + (angle - startAngle);
            if (ev.shiftKey) { newRotate = Math.round(newRotate / 5) * 5; }
            setValueAtPlayhead('rotate', newRotate);
            applyFrame(state.playhead);
        }
        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            renderAll(); save();
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    function startScaleHandle(e, id) {
        e.preventDefault();
        const el = getEl(id);
        const div = canvasEl.querySelector(`[data-id="${id}"]`);
        const rect = div.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
        const startDist = Math.max(1, Math.hypot(e.clientX - centerX, e.clientY - centerY));
        const startScale = trackValueAt(el.tracks.scale || { keyframes: [{ time: 0, value: 1 }] }, state.playhead, 1);
        const pointerId = e.pointerId;
        e.target.setPointerCapture && e.target.setPointerCapture(pointerId);
        function onMove(ev) {
            const dist = Math.max(1, Math.hypot(ev.clientX - centerX, ev.clientY - centerY));
            let newScale = Math.max(0.05, startScale * (dist / startDist));
            newScale = Math.round(newScale * 100) / 100;
            setValueAtPlayhead('scale', newScale);
            applyFrame(state.playhead);
        }
        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            renderAll(); save();
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    function startResizeHandle(e, id) {
        e.preventDefault();
        const el = getEl(id);
        const startWidth = trackValueAt(el.tracks.width || { keyframes: [{ time: 0, value: 100 }] }, state.playhead, 100);
        const startHeight = trackValueAt(el.tracks.height || { keyframes: [{ time: 0, value: 100 }] }, state.playhead, 100);
        const elementScale = trackValueAt(el.tracks.scale || { keyframes: [{ time: 0, value: 1 }] }, state.playhead, 1);
        const startMouse = { x: e.clientX, y: e.clientY };
        const pointerId = e.pointerId;
        e.target.setPointerCapture && e.target.setPointerCapture(pointerId);
        function onMove(ev) {
            const factor = state.canvasZoom * Math.max(0.05, elementScale);
            const dx = (ev.clientX - startMouse.x) / factor, dy = (ev.clientY - startMouse.y) / factor;
            const newWidth = Math.max(5, startWidth + dx);
            const newHeight = Math.max(5, startHeight + dy);
            setValueAtPlayhead('width', newWidth);
            setValueAtPlayhead('height', newHeight);
            applyFrame(state.playhead);
        }
        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            renderAll(); save();
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }
    function setValueAtPlayhead(trackKey, value) {
        const el = selectedEl(); if (!el) return;
        if (!el.tracks[trackKey]) {
            el.tracks[trackKey] = { keyframes: [{ time: 0, value: TRACK_DEFS[trackKey].def, easing: 'linear' }], loop: false, isColor: false };
        }
        const track = el.tracks[trackKey];
        let kf = track.keyframes.find(k => Math.abs(k.time - state.playhead) < 10);
        if (kf) { kf.value = value; }
        else {
            track.keyframes.push({ time: Math.round(state.playhead / 10) * 10, value, easing: 'linear' });
            track.keyframes.sort((a, b) => a.time - b.time);
        }
    }

    // ---------- dragging keyframes on timeline ----------
    function startDragKeyframe(e, trackKey, idx) {
        const el = selectedEl();
        const track = el.tracks[trackKey];
        let kfRef = track.keyframes[idx];
        if (e.altKey) {
            const clone = JSON.parse(JSON.stringify(kfRef));
            track.keyframes.push(clone);
            track.keyframes.sort((a, b) => a.time - b.time);
            kfRef = clone;
        }
        selectKeyframe(trackKey, track.keyframes.indexOf(kfRef));
        function onMove(ev) {
            const rowRect = tracksAreaEl.getBoundingClientRect();
            const px = ev.clientX - rowRect.left;
            const t = Math.round(pxToTime(px) / 10) * 10;
            kfRef.time = t;
            track.keyframes.sort((a, b) => a.time - b.time);
            state.selectedKfIndex = track.keyframes.indexOf(kfRef);
            renderTimeline();
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            renderInspector(); save();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    // ---------- ruler scrub ----------
    function scrub(e) {
        const rect = rulerEl.getBoundingClientRect();
        const px = e.clientX - rect.left;
        state.playhead = pxToTime(px);
        positionPlayhead(); applyFrame(state.playhead);
    }

    // ---------- playback ----------
    let rafId = null, lastTs = null;
    function togglePlay() {
        state.playing = !state.playing;
        const btn = $('playBtn');
        btn.classList.remove('playing', 'paused');
        btn.classList.add(state.playing ? 'playing' : 'paused');
        if (state.playing) { lastTs = null; rafId = requestAnimationFrame(loop); }
        else if (rafId) { cancelAnimationFrame(rafId); }
    }
    function loop(ts) {
        if (!state.playing) return;
        if (lastTs == null) lastTs = ts;
        const dt = ts - lastTs; lastTs = ts;
        state.playhead += dt;
        if (state.playhead > state.duration) { state.playhead = 0; }
        positionPlayhead(); applyFrame(state.playhead);
        rafId = requestAnimationFrame(loop);
    }

    // ---------- export ----------
    function buildExport() {
        let css = '';
        let html = '';
        state.elements.forEach((el, i) => {
            const keys = Object.keys(el.tracks);
            if (!keys.length) { return; }
            const className = 'ts-' + el.id;
            // gather union of times
            const timesSet = new Set();
            keys.forEach(k => el.tracks[k].keyframes.forEach(kf => timesSet.add(kf.time)));
            const times = Array.from(timesSet).sort((a, b) => a - b);
            const anyLoop = keys.some(k => el.tracks[k].loop);
            const startTime = times[0] || 0;
            const endTime = times[times.length - 1] || state.duration;
            const span = Math.max(1, endTime - startTime);

            let keyframeBlocks = '';
            times.forEach(t => {
                const pct = (((t - startTime) / span) * 100).toFixed(2);
                const x = el.tracks.x ? trackValueAt(el.tracks.x, t, 0) : 0;
                const y = el.tracks.y ? trackValueAt(el.tracks.y, t, 0) : 0;
                const scale = el.tracks.scale ? trackValueAt(el.tracks.scale, t, 1) : 1;
                const rotate = el.tracks.rotate ? trackValueAt(el.tracks.rotate, t, 0) : 0;
                const rotateX = el.tracks.rotateX ? trackValueAt(el.tracks.rotateX, t, 0) : 0;
                const rotateY = el.tracks.rotateY ? trackValueAt(el.tracks.rotateY, t, 0) : 0;
                const opacity = el.tracks.opacity ? trackValueAt(el.tracks.opacity, t, 1) : 1;
                const width = el.tracks.width ? trackValueAt(el.tracks.width, t, 100) : null;
                const height = el.tracks.height ? trackValueAt(el.tracks.height, t, 100) : null;
                const radius = el.tracks.borderRadius ? trackValueAt(el.tracks.borderRadius, t, 0) : null;
                const color = el.tracks.color ? trackValueAt(el.tracks.color, t, el.color) : null;
                let decls = `      transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) rotateZ(${rotate.toFixed(1)}deg);\n      opacity: ${opacity.toFixed(2)};\n`;
                if (width != null) decls += `      width: ${width.toFixed(1)}px;\n`;
                if (height != null) decls += `      height: ${height.toFixed(1)}px;\n`;
                if (radius != null) decls += `      border-radius: ${radius.toFixed(1)}px;\n`;
                if (color != null) decls += `      background: ${color};\n`;
                keyframeBlocks += `    ${pct}% {\n${decls}    }\n`;
            });

            css += `@keyframes ${className}-anim {\n${keyframeBlocks}}\n\n`;
            css += `.${className} {\n  position: absolute;\n  top: 0; left: 0;\n  width: ${el.tracks.width ? el.tracks.width.keyframes[0].value : 100}px;\n  height: ${el.tracks.height ? el.tracks.height.keyframes[0].value : 100}px;\n  background: ${el.color};\n  animation: ${className}-anim ${span}ms ${anyLoop ? 'infinite' : '1'} both;\n  animation-delay: ${startTime}ms;\n}\n\n`;
            html += `  <div class="${className}"></div>\n`;
        });

        //const fullHtml = `<!-- Timeline Studio export -->\n<div class="ts-stage" style="position:relative; width:${state.stage.width}px; height:${state.stage.height}px; perspective:1000px;">\n${html}</div>\n\n<style>\n${css}</style>`;
        return { html: `<div class="ts-stage" style="position:relative; width:${state.stage.width}px; height:${state.stage.height}px; perspective:1000px;">\n${html}</div>`, css: css };
    }

    // Shrinks the studio by however much its page/scroll-parents overflow (host padding, margins, siblings),
    // so a `height:100vh` main never makes the page scroll. Re-runs on window resize.
    function fit() {
        if (!root) return;
        if (root.dataset.tsBaseHeight === undefined) root.dataset.tsBaseHeight = root.style.height;
        root.style.height = root.dataset.tsBaseHeight;
        const scrollers = [document.scrollingElement || document.documentElement];
        for (let n = root.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
            const o = getComputedStyle(n).overflowY;
            if (o === 'auto' || o === 'scroll') scrollers.push(n);
        }
        let excess = 0;
        scrollers.forEach(s => { excess = Math.max(excess, s.scrollHeight - s.clientHeight); });
        if (excess > 0) root.style.height = Math.max(320, root.offsetHeight - excess) + 'px';
    }

    // Blazor CSS isolation only styles elements that carry the component's b-xxxx attribute.
    // Nodes this script creates don't have it, so copy it onto everything added under the root.
    function adoptScopeAttr() {
        const attr = root.getAttributeNames().find(n => /^b-[a-z0-9]+$/.test(n));
        if (!attr) return;
        const tag = (n) => { if (n.nodeType === 1) { n.setAttribute(attr, ''); n.querySelectorAll('*').forEach(c => c.setAttribute(attr, '')); } };
        new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(tag))).observe(root, { childList: true, subtree: true });
    }

    // ---------- DOM binding (deferred until init() is called) ----------
    function bindDom() {
        elListEl = $('elList');
        canvasEl = $('canvas');
        trackLabelsEl = $('trackLabels');
        tracksAreaEl = $('tracksArea');
        rulerEl = $('ruler');
        playheadEl = $('playhead');
        playheadHeadEl = $('playheadHead').firstElementChild;
        timeLabelEl = $('timeLabel');
        trackSelectEl = $('trackSelect');
        inspectorEl = $('inspector');
        timelineScrollInner = $('timelineScrollInner');
        tracksScrollEl = $('tracksScroll');
        guidesEl = $('guides');
        stageWEl = $('stageW');
        stageHEl = $('stageH');
        zoomLabelEl = $('zoomLabel');
        canvasWrapEl = $('canvasWrap');
    }

    // ---------- events (deferred until init() is called) ----------
    function bindEvents() {
        let suppressNextCanvasClick = false;
        let spaceHeld = false;
        let hovering = false;
        canvasWrapEl.addEventListener('pointerenter', () => { hovering = true; });
        canvasWrapEl.addEventListener('pointerleave', () => { hovering = false; });
        // One-way sync: the keyframe area is the only thing the user scrolls; the labels just follow it.
        // (Two-way syncing raced against smooth scrolling and made the rows jump.)
        tracksScrollEl.addEventListener('scroll', () => { trackLabelsEl.scrollTop = tracksScrollEl.scrollTop; });
        trackLabelsEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            tracksScrollEl.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        }, { passive: false });

        rulerEl.addEventListener('mousedown', (e) => {
            scrub(e);
            function onMove(ev) { scrub(ev); }
            function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        $('addBtn').addEventListener('click', addElement);
        $('playBtn').addEventListener('click', togglePlay);
        $('durationInput').addEventListener('change', (e) => {
            state.duration = Math.max(500, parseInt(e.target.value) || 5000);
            if (state.playhead > state.duration) state.playhead = state.duration;
            renderAll(); save();
        });

        trackSelectDD = Dropdown(trackSelectEl);
        easingDD = Dropdown($('kfEasing'), onEasingChange);
        easingDD.setOptions(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].map(v => ({ value: v, label: v })).concat([{ value: 'custom', label: 'Custom (cubic-bezier)' }]));
        document.addEventListener('pointerdown', (e) => { dropdowns.forEach(d => { if (!d.host.contains(e.target)) d.close(); }); });

        function onStageDimInput() {
            state.stage.width = clampStage(stageWEl.value, state.stage.width);
            state.stage.height = clampStage(stageHEl.value, state.stage.height);
            stageWEl.value = state.stage.width;
            stageHEl.value = state.stage.height;
            renderCanvas(); save();
        }
        stageWEl.addEventListener('change', onStageDimInput);
        stageHEl.addEventListener('change', onStageDimInput);

        function setZoom(z) {
            state.canvasZoom = Math.max(0.1, Math.min(3, Math.round(z * 100) / 100));
            zoomLabelEl.textContent = Math.round(state.canvasZoom * 100) + '%';
            applyStageSize();
            save();
        }
        $('zoomInBtn').addEventListener('click', () => setZoom(state.canvasZoom + 0.1));
        $('zoomOutBtn').addEventListener('click', () => setZoom(state.canvasZoom - 0.1));
        $('zoomResetBtn').addEventListener('click', () => {
            state.canvasPan.x = 0; state.canvasPan.y = 0;
            setZoom(1);
        });

        $('addTrackBtn').addEventListener('click', () => {
            if (trackSelectDD.value) addTrackToSelected(trackSelectDD.value);
        });
        $('deleteKfBtn').addEventListener('click', deleteSelectedKeyframe);
        $('kfTime').addEventListener('change', (e) => {
            const el = selectedEl(); const track = el.tracks[state.selectedTrack];
            const kf = track.keyframes[state.selectedKfIndex];
            kf.time = Math.max(0, Math.min(state.duration, parseFloat(e.target.value) || 0));
            track.keyframes.sort((a, b) => a.time - b.time);
            state.selectedKfIndex = track.keyframes.indexOf(kf);
            renderAll(); save();
        });
        $('kfValueNum').addEventListener('change', (e) => {
            const el = selectedEl(); const track = el.tracks[state.selectedTrack];
            track.keyframes[state.selectedKfIndex].value = parseFloat(e.target.value) || 0;
            renderAll(); save();
        });
        $('kfValueColor').addEventListener('change', (e) => {
            const el = selectedEl(); const track = el.tracks[state.selectedTrack];
            track.keyframes[state.selectedKfIndex].value = e.target.value;
            renderAll(); save();
        });
        function onEasingChange(v) {
            const el = selectedEl(); const track = el.tracks[state.selectedTrack];
            const kf = track.keyframes[state.selectedKfIndex];
            kf.easing = v;
            if (kf.easing === 'custom' && !kf.bezier) kf.bezier = [0.25, 0.1, 0.25, 1];
            renderInspector(); save();
        }
        ['bz1', 'bz2', 'bz3', 'bz4'].forEach((id, i) => {
            $(id).addEventListener('change', () => {
                const el = selectedEl(); const track = el.tracks[state.selectedTrack];
                const kf = track.keyframes[state.selectedKfIndex];
                if (!kf.bezier) kf.bezier = [0.25, 0.1, 0.25, 1];
                kf.bezier[i] = parseFloat($(id).value) || 0;
                save();
            });
        });

        canvasWrapEl.addEventListener('click', (e) => {
            if (suppressNextCanvasClick) { suppressNextCanvasClick = false; return; }
            if (e.target !== canvasWrapEl && e.target !== canvasEl) return; // only empty space, not an element/handle
            if (state.selectedElementId == null) return;
            state.selectedElementId = null;
            state.selectedTrack = null; state.selectedKfIndex = null;
            renderAll();
        });

        // ---------- Alt+scroll, Ctrl+scroll or trackpad pinch (= ctrl+wheel) zoom the scene toward the cursor ----------
        canvasWrapEl.addEventListener('wheel', (e) => {
            if (!(e.altKey || e.ctrlKey || e.metaKey)) return;
            e.preventDefault(); // also stops the browser from zooming the whole page
            const rect = canvasWrapEl.getBoundingClientRect();
            const wrapCenterX = rect.left + rect.width / 2, wrapCenterY = rect.top + rect.height / 2;
            const oldZoom = state.canvasZoom;
            const dy = Math.max(-200, Math.min(200, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY));
            const newZoom = Math.max(0.1, Math.min(3, Math.round(oldZoom * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)) * 1000) / 1000));
            if (newZoom === oldZoom) return;
            const offsetX = e.clientX - wrapCenterX - state.canvasPan.x;
            const offsetY = e.clientY - wrapCenterY - state.canvasPan.y;
            state.canvasPan.x += offsetX * (1 - newZoom / oldZoom);
            state.canvasPan.y += offsetY * (1 - newZoom / oldZoom);
            state.canvasZoom = newZoom;
            zoomLabelEl.textContent = Math.round(newZoom * 100) + '%';
            applyStageSize();
            save();
        }, { passive: false });

        // ---------- Space + drag to pan (like Photoshop/Illustrator) ----------
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !spaceHeld && hovering) {
                const tag = (document.activeElement && document.activeElement.tagName) || '';
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                e.preventDefault();
                spaceHeld = true;
                canvasWrapEl.style.cursor = 'grab';
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                spaceHeld = false;
                canvasWrapEl.style.cursor = '';
            }
        });
        canvasWrapEl.addEventListener('pointerdown', (e) => {
            if (!spaceHeld) return;
            e.preventDefault();
            canvasWrapEl.style.cursor = 'grabbing';
            const startX = e.clientX, startY = e.clientY;
            const startPanX = state.canvasPan.x, startPanY = state.canvasPan.y;
            let moved = false;
            const pointerId = e.pointerId;
            canvasWrapEl.setPointerCapture && canvasWrapEl.setPointerCapture(pointerId);
            function onMove(ev) {
                const dx = ev.clientX - startX, dy = ev.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
                state.canvasPan.x = startPanX + dx;
                state.canvasPan.y = startPanY + dy;
                applyStageSize();
            }
            function onUp() {
                canvasWrapEl.style.cursor = spaceHeld ? 'grab' : '';
                if (moved) suppressNextCanvasClick = true;
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                save();
            }
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        });
    }

    // ---------- init ----------
    // Call window.TimelineStudio.init() yourself once the markup is in the DOM
    // (e.g. from Blazor's OnAfterRenderAsync via JS interop). Nothing in this
    // file touches the DOM or reads/writes time-related state until init() runs.
    function init(rootEl) {
        root = rootEl || document.querySelector('.slvz-timeline-studio');
        if (!root) return;
        adoptScopeAttr();
        buildPalette();
        bindDom();
        bindEvents();
        load();
        if (!state.canvasZoom) state.canvasZoom = 1;
        if (!state.canvasPan) state.canvasPan = { x: 0, y: 0 };
        $('durationInput').value = state.duration;
        state.stage.width = clampStage(state.stage.width, 854);
        state.stage.height = clampStage(state.stage.height, 480);
        $('stageW').value = state.stage.width;
        $('stageH').value = state.stage.height;
        zoomLabelEl.textContent = Math.round(state.canvasZoom * 100) + '%';
        $('playBtn').classList.remove('playing', 'paused');
        $('playBtn').classList.add(state.playing ? 'playing' : 'paused');
        renderAll();
        requestAnimationFrame(fit);
        window.addEventListener('resize', fit);
    }

    return { addElement, init, fit, buildExport };
})();