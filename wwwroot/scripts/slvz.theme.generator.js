
(function (global) {
    'use strict';

    /* ── Color math ── */
    function hexToHsl(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255,
            g = parseInt(hex.slice(3, 5), 16) / 255,
            b = parseInt(hex.slice(5, 7), 16) / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        let h, s, l = (mx + mn) / 2;
        if (mx === mn) { h = s = 0; } else {
            const d = mx - mn;
            s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
            switch (mx) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hsl(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    function clamp(v, mn = 0, mx = 100) { return Math.max(mn, Math.min(mx, v)); }

    function rgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }

    /* ── Clay shadow formula ── */
    function clayShadow(color, size = 1, dark = false) {
        const sc = dark ? 0.7 : 0.25;
        const hc = dark ? 0.12 : 0.55;
        const dc = dark ? 0.5 : 0.15;
        const s = size;
        return [
            `${4 * s}px ${8 * s}px ${20 * s}px ${rgba(color, sc)}`,
            `inset ${2 * s}px ${3 * s}px ${6 * s}px rgba(255,255,255,${hc})`,
            `inset -${2 * s}px -${3 * s}px ${6 * s}px ${rgba(color, dc)}`
        ].join(', ');
    }

    function cardShadow(color, dark = false) {
        if (dark) return `6px 12px 30px rgba(0,0,0,0.4), inset 1px 2px 4px rgba(255,255,255,0.07), inset -1px -2px 4px rgba(0,0,0,0.3)`;
        return `6px 12px 30px ${rgba(color, 0.22)}, inset 2px 3px 6px rgba(255,255,255,0.7), inset -2px -3px 6px ${rgba(color, 0.12)}`;
    }

    /* ── Theme generator (same math as the HTML file) ── */
    function genTheme(hex, m) {
        const [h, s, l] = hexToHsl(hex);
        const dk = m === 'dark';

        const primaryLight = hsl(h, clamp(s + 5), clamp(l + 14));
        const pageBg = dk ? hsl(h, clamp(s, 0, 22), 12) : hsl(h, clamp(s, 0, 28), 92);
        const cardBg = dk ? hsl(h, clamp(s, 0, 20), 17) : hsl(h, clamp(s, 0, 20), 98);
        const cardPaleBg = dk ? hsl(h, clamp(s, 0, 18), 20) : hsl(h, clamp(s, 0, 22), 95);
        const fontLight = dk ? hsl(h, clamp(s, 0, 30), 68) : hsl(h, clamp(s, 0, 40), 40);
        const fontBold = dk ? hsl(h, clamp(s, 0, 15), 90) : hsl(h, clamp(s, 0, 50), 20);
        const btnPaleBg = dk ? hsl(h, clamp(s, 0, 25), 22) : hsl(h, clamp(s, 0, 28), 90);
        const btnPaleHover = dk ? hsl(h, clamp(s, 0, 25), 27) : hsl(h, clamp(s, 0, 28), 84);
        const btnDefBg = dk ? hsl(h, clamp(s, 0, 15), 19) : '#ffffff';
        const btnDefHover = dk ? hsl(h, clamp(s, 0, 15), 23) : hsl(h, clamp(s, 0, 18), 94);
        const svgLight = dk ? hsl(h, clamp(s, 0, 35), 58) : hsl(h, clamp(s, 0, 40), 72);
        const svgDark = dk ? hsl(h, clamp(s, 0, 20), 85) : hsl(h, clamp(s, 0, 50), 20);
        const dialogBg = dk ? cardBg : '#ffffff';
        const dialogBorder = dk ? hsl(h, clamp(s, 0, 20), 24) : hsl(h, clamp(s, 0, 22), 86);
        const dialogCont = rgba(pageBg, 0.72);

        return {
            '--primary-color': hex,
            '--primary-light-color': primaryLight,
            '--primary-hue': h,
            '--primary-sat': s + '%',
            '--primary-light': l + '%',
            '--page-background': pageBg,
            '--font-light-color': fontLight,
            '--font-bold-color': fontBold,
            '--card-background': cardBg,
            '--card-shadow': cardShadow(hex, dk),
            '--card-pale-background': cardPaleBg,
            '--card-pale-shadow': cardShadow(hex, dk),
            '--btn-primary-background': hex,
            '--btn-primary-shadow': clayShadow(hex, 1, dk),
            '--btn-primary-text-color': '#ffffff',
            '--btn-primary-hovered-background': primaryLight,
            '--btn-pale-background': btnPaleBg,
            '--btn-pale-shadow': clayShadow(hex, 0.7, dk),
            '--btn-pale-text-color': hex,
            '--btn-pale-hovered-background': btnPaleHover,
            '--btn-default-background': btnDefBg,
            '--btn-default-shadow': cardShadow(hex, dk),
            '--btn-default-text-color': fontBold,
            '--btn-default-hovered-background': btnDefHover,
            '--svg-light-fill': svgLight,
            '--svg-dark-fill': svgDark,
            '--dialog-background': dialogBg,
            '--dialog-border': `1px solid ${dialogBorder}`,
            '--dialog-shadow': `0 20px 60px ${rgba(hex, 0.25)}, inset 1px 2px 4px rgba(255,255,255,${dk ? 0.06 : 0.8})`,
            '--dialog-container-background': dialogCont,

            '--textbox-background': cardBg,
            '--textbox-shadow': `inset 3px 4px 10px ${rgba(hex, dk ? 0.3 : 0.1)}, inset -2px -3px 8px rgba(255,255,255,${dk ? 0.04 : 0.8})`,

            '--radiobtn-background': btnPaleBg,
            '--radiobtn-shadow': `inset 3px 3px 8px ${rgba(hex, dk ? 0.35 : 0.13)}, inset -2px -2px 5px rgba(255,255,255,${dk ? 0.05 : 0.65})`,
            '--radiobtn-toggle-color': 'transparent',

            '--radiobtn-checked-background': hex,
            '--radiobtn-checked-shadow': clayShadow(hex, 0.7, dk),
            '--radiobtn-checked-toggle-color': '#ffffff',

            '--checkbox-background': btnPaleBg,
            '--checkbox-shadow': `inset 3px 3px 8px ${rgba(hex, dk ? 0.35 : 0.13)}, inset -2px -2px 5px rgba(255,255,255,${dk ? 0.05 : 0.65})`,

            '--checkbox-checked-background': hex,
            '--checkbox-checked-shadow': clayShadow(hex, 0.7, dk),
            '--checkbox-checked-svg-fill': '#ffffff',

            '--trackbar-track-background': btnPaleBg,
            '--trackbar-track-shadow': `inset 3px 3px 8px ${rgba(hex, dk ? 0.35 : 0.12)}, inset -2px -2px 6px rgba(255,255,255,${dk ? 0.04 : 0.7})`,
            '--trackbar-fill-background': hex,
            '--trackbar-thumb-background': '#ffffff',
            '--trackbar-thumb-shadow': clayShadow(hex, 0.9, dk),
        };
    }

    
    function toCssRule(vars) {
        const props = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');
        return `.my-theme { ${props} background: var(--page-background); }`;
    }

    const STYLE_TAG_ID = 'my-theme-style';

    /**
     * GenerateTheme(color, mode, code)
     */
    function GenerateTheme(color, mode, code) {
        const dk = String(mode).toLowerCase() !== 'light';
        const vars = genTheme(color, dk ? 'dark' : 'light');
        const cssText = toCssRule(vars);

        // Remove old style
        const oldStyle = document.getElementById(STYLE_TAG_ID);
        if (oldStyle) oldStyle.remove();

        // Create new head style
        const styleEl = document.createElement('style');
        styleEl.id = STYLE_TAG_ID;
        styleEl.textContent = cssText;
        document.head.appendChild(styleEl);

        document.body.removeAttribute('class');
        document.body.classList.add('my-theme');

        localStorage.setItem("Color", color + " " + mode);

        if (code) {
            code.removeAttribute('data-highlighted');
            code.textContent = cssText;
            hljs.highlightAll();
        }

        return cssText;
    }

    global.GenerateTheme = GenerateTheme;

})(typeof window !== 'undefined' ? window : this);
