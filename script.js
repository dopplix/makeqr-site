/* makeqr.io — live QR generation */

(() => {
    const TYPE_LABEL = {
        url: 'URL', instagram: 'Instagram', text: 'Text', email: 'Email', phone: 'Phone',
        sms: 'SMS', wifi: 'Wi-Fi', vcard: 'Contact', geo: 'Location',
    };

    const state = {
        type: 'url',
        fields: {
            'url.value': 'https://makeqr.io',
            'instagram.username': '',
            'text.value': '',
            'email.address': '', 'email.subject': '', 'email.body': '',
            'phone.number': '',
            'sms.number': '', 'sms.message': '',
            'wifi.ssid': '', 'wifi.password': '', 'wifi.encryption': 'WPA', 'wifi.hidden': false,
            'vcard.firstName': '', 'vcard.lastName': '',
            'vcard.org': '', 'vcard.title': '',
            'vcard.phone': '', 'vcard.email': '', 'vcard.url': '',
            'geo.lat': '', 'geo.lng': '',
        },
        style: {
            fg: '#0a0a0d',
            bg: '#ffffff',
            shape: 'square',
        },
    };

    /* ---------- payload builders ---------- */

    const escWifi = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');

    function buildPayload() {
        const f = state.fields;
        switch (state.type) {
            case 'url':
                return f['url.value'].trim();
            case 'instagram': {
                let u = (f['instagram.username'] || '').trim()
                    .replace(/^@+/, '')
                    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
                    .replace(/[/?#].*$/, '');
                return u ? `https://www.instagram.com/${encodeURIComponent(u)}` : '';
            }
            case 'text':
                return f['text.value'];
            case 'email': {
                if (!f['email.address']) return '';
                const params = [];
                if (f['email.subject']) params.push('subject=' + encodeURIComponent(f['email.subject']));
                if (f['email.body']) params.push('body=' + encodeURIComponent(f['email.body']));
                return `mailto:${f['email.address']}${params.length ? '?' + params.join('&') : ''}`;
            }
            case 'phone': {
                const n = f['phone.number'].replace(/[^\d+]/g, '');
                return n ? `tel:${n}` : '';
            }
            case 'sms': {
                const n = f['sms.number'].replace(/[^\d+]/g, '');
                if (!n) return '';
                const body = f['sms.message'];
                return body ? `SMSTO:${n}:${body}` : `sms:${n}`;
            }
            case 'wifi': {
                const ssid = f['wifi.ssid'];
                if (!ssid) return '';
                const enc = f['wifi.encryption'] || 'nopass';
                const pass = f['wifi.password'];
                const hidden = f['wifi.hidden'] ? 'true' : 'false';
                const passPart = enc !== 'nopass' && pass ? `P:${escWifi(pass)};` : '';
                return `WIFI:T:${enc};S:${escWifi(ssid)};${passPart}H:${hidden};;`;
            }
            case 'vcard': {
                const fn = `${f['vcard.firstName']} ${f['vcard.lastName']}`.trim();
                if (!fn && !f['vcard.org'] && !f['vcard.phone'] && !f['vcard.email']) return '';
                const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
                if (fn) lines.push(`FN:${fn}`);
                if (f['vcard.firstName'] || f['vcard.lastName']) {
                    lines.push(`N:${f['vcard.lastName']};${f['vcard.firstName']};;;`);
                }
                if (f['vcard.org']) lines.push(`ORG:${f['vcard.org']}`);
                if (f['vcard.title']) lines.push(`TITLE:${f['vcard.title']}`);
                if (f['vcard.phone']) lines.push(`TEL;TYPE=CELL:${f['vcard.phone']}`);
                if (f['vcard.email']) lines.push(`EMAIL:${f['vcard.email']}`);
                if (f['vcard.url']) lines.push(`URL:${f['vcard.url']}`);
                lines.push('END:VCARD');
                return lines.join('\n');
            }
            case 'geo': {
                const lat = f['geo.lat'].trim();
                const lng = f['geo.lng'].trim();
                return (lat && lng) ? `geo:${lat},${lng}` : '';
            }
        }
        return '';
    }

    function effectivePayload() {
        const p = buildPayload();
        return (p && p.trim()) ? p : 'https://makeqr.io';
    }

    /* ---------- qr setup ---------- */

    function cornerSquareType() {
        return ['dots'].includes(state.style.shape) ? 'dot'
             : ['rounded', 'classy-rounded'].includes(state.style.shape) ? 'extra-rounded'
             : 'square';
    }

    function buildOptions(extra = {}, forDownload = false) {
        const opts = Object.assign({
            width: 480,
            height: 480,
            type: 'svg',
            data: effectivePayload(),
            qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
            dotsOptions: { color: state.style.fg, type: state.style.shape },
            backgroundOptions: { color: state.style.bg },
            cornersSquareOptions: { color: state.style.fg, type: cornerSquareType() },
            cornersDotOptions: { color: state.style.fg, type: state.style.shape === 'dots' ? 'dot' : '' },
        }, extra);
        // Preview: zero margin — the qr-frame's white inset provides visual quiet zone.
        // Downloads include a proper 4-module quiet zone (~5% of width) so the file scans on its own.
        opts.margin = forDownload
            ? Math.max(16, Math.round((opts.width || 480) * 0.05))
            : 0;
        return opts;
    }

    let qr;
    const target = document.getElementById('qr-canvas');
    const frame = document.getElementById('qr-frame');

    // qr-code-styling renders the SVG without a viewBox, which makes CSS-scaled SVGs
    // clip their content (native 480px coords inside a smaller rendered box).
    // Patch the SVG every time it (re)renders so the QR scales cleanly.
    function patchSvgViewBox() {
        const svg = target.querySelector('svg');
        if (!svg) return;
        if (!svg.hasAttribute('viewBox')) {
            const w = svg.getAttribute('width') || '480';
            const h = svg.getAttribute('height') || '480';
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    const svgObserver = new MutationObserver(() => patchSvgViewBox());

    function initQR() {
        target.innerHTML = '';
        qr = new QRCodeStyling(buildOptions());
        qr.append(target);
        patchSvgViewBox();
        svgObserver.observe(target, { childList: true, subtree: true });
        updateMeta();
        applyFrameBg();
    }

    function updateQR() {
        if (!qr) return;
        qr.update(buildOptions());
        patchSvgViewBox();
        updateMeta();
        applyFrameBg();
    }

    function applyFrameBg() {
        frame.style.background = state.style.bg;
    }

    function updateMeta() {
        const data = effectivePayload();
        const bytes = new Blob([data]).size;
        document.getElementById('stat-bytes').textContent = `${bytes} B`;
        document.getElementById('stat-type').textContent = TYPE_LABEL[state.type] || '—';
    }

    /* ---------- input bindings ---------- */

    let updTimer;
    function scheduleUpdate() {
        clearTimeout(updTimer);
        updTimer = setTimeout(updateQR, 80);
    }

    document.querySelectorAll('[data-bind]').forEach((el) => {
        const key = el.dataset.bind;
        if (state.fields[key] !== undefined) {
            if (el.type === 'checkbox') el.checked = !!state.fields[key];
            else if (el.value === '' || el.value == null) el.value = state.fields[key];
        }
        const ev = el.type === 'checkbox' ? 'change' : 'input';
        el.addEventListener(ev, () => {
            state.fields[key] = el.type === 'checkbox' ? el.checked : el.value;
            scheduleUpdate();
        });
    });

    document.querySelectorAll('input[name="wifi-encryption"]').forEach((el) => {
        el.addEventListener('change', () => {
            if (el.checked) {
                state.fields['wifi.encryption'] = el.value;
                scheduleUpdate();
            }
        });
    });

    /* ---------- type tabs ---------- */

    document.querySelectorAll('.type').forEach((btn) => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.type;
            if (t === state.type) return;
            state.type = t;
            document.querySelectorAll('.type').forEach((b) => b.removeAttribute('aria-current'));
            btn.setAttribute('aria-current', 'true');
            document.querySelectorAll('.form').forEach((f) => {
                const active = f.dataset.form === t;
                f.hidden = !active;
                f.classList.toggle('is-active', active);
            });
            const firstInput = document.querySelector(`.form[data-form="${t}"] .field-input`);
            if (firstInput) {
                setTimeout(() => firstInput.focus({ preventScroll: true }), 50);
            }
            updateQR();
        });
    });

    /* ---------- color swatches ---------- */

    document.querySelectorAll('.swatches').forEach((group) => {
        const target = group.dataset.target;
        group.querySelectorAll('.swatch:not(.swatch-custom)').forEach((sw) => {
            sw.addEventListener('click', () => {
                state.style[target] = sw.dataset.color;
                group.querySelectorAll('.swatch').forEach((s) => s.removeAttribute('aria-current'));
                sw.setAttribute('aria-current', 'true');
                const colorInput = group.querySelector('input[type="color"]');
                if (colorInput) colorInput.value = sw.dataset.color;
                scheduleUpdate();
            });
        });
        const colorInput = group.querySelector('input[type="color"]');
        if (colorInput) {
            colorInput.addEventListener('input', () => {
                state.style[target] = colorInput.value;
                group.querySelectorAll('.swatch').forEach((s) => s.removeAttribute('aria-current'));
                scheduleUpdate();
            });
        }
    });

    /* ---------- shape ---------- */

    document.querySelectorAll('.shape').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.style.shape = btn.dataset.shape;
            document.querySelectorAll('.shape').forEach((s) => s.removeAttribute('aria-current'));
            btn.setAttribute('aria-current', 'true');
            scheduleUpdate();
        });
    });

    /* ---------- export ---------- */

    async function downloadQR(format, size) {
        const opts = buildOptions({
            width: size || 1024,
            height: size || 1024,
            type: format === 'svg' ? 'svg' : 'canvas',
        }, true);
        const inst = new QRCodeStyling(opts);
        try {
            const blob = await inst.getRawData(format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = format === 'svg' ? 'makeqr.svg' : `makeqr-${size}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (err) {
            console.error('Export failed:', err);
        }
    }

    document.querySelector('.export-primary').addEventListener('click', () => downloadQR('svg'));
    document.querySelectorAll('.export-png button').forEach((btn) => {
        btn.addEventListener('click', () => {
            downloadQR('png', parseInt(btn.dataset.size, 10));
        });
    });

    /* ---------- init ---------- */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQR);
    } else {
        initQR();
    }
})();
