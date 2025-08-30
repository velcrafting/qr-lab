import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

type Mode = 'url' | 'text' | 'wifi' | 'vcard' | 'event';
type Ecc = 'L' | 'M' | 'Q' | 'H';

type Preset = {
  name: string;
  apply: () => void;
};

function buildWifi({ ssid, password, encryption, hidden }: { ssid: string; password: string; encryption: 'WPA' | 'WEP' | 'nopass'; hidden: boolean; }) {
  const esc = (s: string) => s.replace(/([\\;:,"'])/g, '\\$1');
  return `WIFI:T:${encryption};S:${esc(ssid)};${encryption !== 'nopass' ? `P:${esc(password)};` : ''}${hidden ? 'H:true;' : ''};`;
}

type VCardInput = {
  first: string;
  last: string;
  org: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  street: string;
  city: string;
  region: string;
  zip: string;
  country: string;
};

function buildVCard({ first, last, org, title, phone, email, url, street, city, region, zip, country }: VCardInput) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${last};${first};;;`,
    `FN:${first} ${last}`.trim(),
    org && `ORG:${org}`,
    title && `TITLE:${title}`,
    phone && `TEL;TYPE=CELL:${phone}`,
    email && `EMAIL:${email}`,
    url && `URL:${url}`,
    (street || city || region || zip || country) && `ADR;TYPE=WORK:;;${street};${city};${region};${zip};${country}`,
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\r\n');
}

type EventInput = {
  summary: string;
  location: string;
  description: string;
  start: string;
  end: string;
};

function buildEvent({ summary, location, description, start, end }: EventInput) {
  // Treat datetimes as local and append Z for simplicity
  const startLocal = start ? start.replace(/[-:]/g, '').replace(/\..*$/, '') + 'Z' : '';
  const endLocal = end ? end.replace(/[-:]/g, '').replace(/\..*$/, '') + 'Z' : '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    summary && `SUMMARY:${summary}`,
    location && `LOCATION:${location}`,
    description && `DESCRIPTION:${description}`,
    startLocal && `DTSTART:${startLocal}`,
    endLocal && `DTEND:${endLocal}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function App() {
  const [mode, setMode] = useState<Mode>('url');
  const [text, setText] = useState('https://velcrafting.com');
  const [ecc, setEcc] = useState<Ecc>('M');
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(4);
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [useGradient, setUseGradient] = useState(false);
  const [gradA, setGradA] = useState('#0ea5e9');
  const [gradB, setGradB] = useState('#22c55e');
  const [gradAngle, setGradAngle] = useState(45);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [brandingEnabled, setBrandingEnabled] = useState(true);
  const [logoSizePct, setLogoSizePct] = useState(18); // percent of QR size
  const [defaultLogoDataUrl, setDefaultLogoDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // WiFi
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' as 'WPA' | 'WEP' | 'nopass', hidden: false });
  // vCard
  const [vcard, setVcard] = useState({ first: '', last: '', org: '', title: '', phone: '', email: '', url: '', street: '', city: '', region: '', zip: '', country: '' });
  // Event
  const [event, setEvent] = useState({ summary: '', location: '', description: '', start: '', end: '' });

  // Showcase presets
  const presets: Preset[] = [
    {
      name: 'Website (velcrafting.com)',
      apply: () => { setMode('url'); setText('https://velcrafting.com'); setUseGradient(true); setGradA('#0ea5e9'); setGradB('#22c55e'); setGradAngle(45); setEcc('M'); setLogoDataUrl(null); }
    },
    {
      name: 'GitHub Profile',
      apply: () => { setMode('url'); setText('https://github.com/velcrafting'); setUseGradient(false); setDark('#000000'); setLight('#ffffff'); setEcc('M'); setLogoDataUrl(null); }
    },
    {
      name: 'WiFi: Studio',
      apply: () => { setMode('wifi'); setWifi({ ssid: 'Studio', password: 'changeme123', encryption: 'WPA', hidden: false }); setUseGradient(true); setGradA('#7c3aed'); setGradB('#22d3ee'); setEcc('H'); }
    },
    {
      name: 'vCard: Steven',
      apply: () => { setMode('vcard'); setVcard({ first: 'Steven', last: 'Pajewski', org: 'Velcrafting', title: 'Engineer', phone: '+1 555 123 4567', email: 'hello@velcrafting.com', url: 'https://velcrafting.com', street: '', city: '', region: '', zip: '', country: '' }); setUseGradient(false); setEcc('Q'); }
    },
    {
      name: 'Event: Demo Day',
      apply: () => { setMode('event'); setEvent({ summary: 'Demo Day', location: 'Online', description: 'Lightning demos', start: '2025-09-01T10:00', end: '2025-09-01T11:00' }); setUseGradient(true); setGradA('#ef4444'); setGradB('#f59e0b'); setEcc('Q'); }
    },
    {
      name: 'SMS Me',
      apply: () => { setMode('text'); setText('SMSTO:+15551234567:Hello!'); setUseGradient(false); setEcc('M'); }
    },
    {
      name: 'Email Me',
      apply: () => { setMode('text'); setText('mailto:hello@velcrafting.com?subject=Hello&body=Hi'); setUseGradient(false); setEcc('M'); }
    },
    {
      name: 'Geo: Times Square',
      apply: () => { setMode('text'); setText('geo:40.7580,-73.9855'); setUseGradient(true); setGradA('#06b6d4'); setGradB('#10b981'); setEcc('M'); }
    },
    {
      name: 'LinkedIn Profile',
      apply: () => { setMode('url'); setText('https://www.linkedin.com/in/your-handle'); setUseGradient(true); setGradA('#0a66c2'); setGradB('#60a5fa'); setEcc('M'); setLogoDataUrl(null); }
    },
    {
      name: 'YouTube Channel',
      apply: () => { setMode('url'); setText('https://youtube.com/@yourchannel'); setUseGradient(true); setGradA('#ef4444'); setGradB('#f87171'); setEcc('Q'); setLogoDataUrl(null); }
    },
    {
      name: 'App Store Listing',
      apply: () => { setMode('url'); setText('https://apps.apple.com/app/id000000000'); setUseGradient(true); setGradA('#6366f1'); setGradB('#22d3ee'); setEcc('Q'); setLogoDataUrl(null); }
    },
    {
      name: 'Portfolio: Work',
      apply: () => { setMode('url'); setText('https://velcrafting.com/work'); setUseGradient(true); setGradA('#10b981'); setGradB('#84cc16'); setEcc('M'); setLogoDataUrl(null); }
    },
    {
      name: 'Directions to Office',
      apply: () => { setMode('url'); setText('https://maps.google.com/?q=Velcrafting'); setUseGradient(false); setDark('#111827'); setLight('#ffffff'); setEcc('M'); setLogoDataUrl(null); }
    }
  ];

  const payload = useMemo(() => {
    switch (mode) {
      case 'url':
      case 'text':
        return text;
      case 'wifi':
        return buildWifi(wifi);
      case 'vcard':
        return buildVCard(vcard);
      case 'event':
        return buildEvent(event);
      default:
        return text;
    }
  }, [mode, text, wifi, vcard, event]);

  const debouncedPayload = useDebounced(payload, 100);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Try to load a default brand logo from public/logo.svg
  useEffect(() => {
    const url = new URL('./logo.svg', window.location.href).toString();
    fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        const txt = await res.text();
        const data = 'data:image/svg+xml;utf8,' + encodeURIComponent(txt);
        setDefaultLogoDataUrl(data);
        return null;
      })
      .catch(() => {});
  }, []);

  // Generate SVG whenever inputs change
  useEffect(() => {
    if (typeof qrcode === 'undefined') return;
    try {
      const qr = qrcode(0, ecc);
      qr.addData(debouncedPayload || '');
      qr.make();
      const svgStr: string = qr.createSvgTag(size / qr.getModuleCount(), margin);

      // Parse SVG and apply colors/gradient/logo
      const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
      const svg = doc.documentElement as unknown as SVGSVGElement;
      // Ensure width/height attrs
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));

      // Prepare defs/gradient if needed
      let paintId = '';
      if (useGradient) {
        const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const lg = doc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        paintId = 'grad-' + Math.random().toString(36).slice(2, 8);
        lg.setAttribute('id', paintId);
        const a = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
        a.setAttribute('offset', '0%');
        a.setAttribute('stop-color', gradA);
        const b = doc.createElementNS('http://www.w3.org/2000/svg', 'stop');
        b.setAttribute('offset', '100%');
        b.setAttribute('stop-color', gradB);
        // Convert angle to x1/y1/x2/y2
        const rad = (gradAngle % 360) * Math.PI / 180;
        const x = (Math.cos(rad) + 1) / 2;
        const y = (Math.sin(rad) + 1) / 2;
        lg.setAttribute('x1', String(1 - x));
        lg.setAttribute('y1', String(1 - y));
        lg.setAttribute('x2', String(x));
        lg.setAttribute('y2', String(y));
        lg.appendChild(a); lg.appendChild(b);
        defs.appendChild(lg);
        svg.insertBefore(defs, svg.firstChild);
      }

      // Paint background light color
      const bg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', '0');
      bg.setAttribute('y', '0');
      bg.setAttribute('width', '100%');
      bg.setAttribute('height', '100%');
      bg.setAttribute('fill', light);
      svg.insertBefore(bg, svg.firstChild);

      // Colorize modules: set fill on dark modules only
      const darkPaint = useGradient ? `url(#${paintId})` : dark;
      const nodes = Array.from(svg.querySelectorAll('[fill]')) as SVGElement[];
      nodes.forEach((n) => {
        const fill = (n.getAttribute('fill') || '').toLowerCase();
        if (fill === '#000000' || fill === '#000' || fill === 'black') {
          n.setAttribute('fill', darkPaint);
        }
      });

      // Optional: add center logo or default branding watermark
      if (logoDataUrl || brandingEnabled) {
        const vb = (svg.getAttribute('viewBox') || `0 0 ${size} ${size}`).split(/\s+/).map(Number);
        const w = vb[2] || size; const h = vb[3] || size;
        const box = Math.min(w, h) * (logoSizePct / 100);
        const cx = w / 2; const cy = h / 2;
        const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(cx - box / 2));
        rect.setAttribute('y', String(cy - box / 2));
        rect.setAttribute('width', String(box));
        rect.setAttribute('height', String(box));
        rect.setAttribute('rx', String(box * 0.1));
        rect.setAttribute('fill', light);
        rect.setAttribute('stroke', '#ffffff');
        rect.setAttribute('stroke-width', String(Math.max(2, size * 0.01)));
        svg.appendChild(rect);

        if (logoDataUrl) {
          const img = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
          img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', logoDataUrl);
          img.setAttribute('x', String(cx - box * 0.42));
          img.setAttribute('y', String(cy - box * 0.42));
          img.setAttribute('width', String(box * 0.84));
          img.setAttribute('height', String(box * 0.84));
          img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.appendChild(img);
        } else if (brandingEnabled) {
          if (defaultLogoDataUrl) {
            const img = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', defaultLogoDataUrl);
            img.setAttribute('x', String(cx - box * 0.42));
            img.setAttribute('y', String(cy - box * 0.42));
            img.setAttribute('width', String(box * 0.84));
            img.setAttribute('height', String(box * 0.84));
            img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.appendChild(img);
          } else {
            // Fallback vector watermark
            const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${cx},${cy})`);
            const r = box * 0.36;
            const emblem = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
            emblem.setAttribute('cx', '0');
            emblem.setAttribute('cy', '0');
            emblem.setAttribute('r', String(r));
            emblem.setAttribute('fill', useGradient ? `url(#${paintId})` : dark);
            const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '0');
            text.setAttribute('y', '0');
            text.setAttribute('fill', light);
            text.setAttribute('font-size', String(r * 1.1));
            text.setAttribute('font-weight', '700');
            text.setAttribute('font-family', 'system-ui, ui-sans-serif, Arial');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.textContent = 'VC';
            g.appendChild(emblem);
            g.appendChild(text);
            svg.appendChild(g);
          }
        }
      }

      // Mount into DOM
      const mount = document.getElementById('qr-target');
      if (mount) {
        mount.innerHTML = '';
        mount.appendChild(svg);
        svgRef.current = svg;
      }
    } catch (err) {
      console.error('QR generation error', err);
    }
  }, [debouncedPayload, ecc, size, margin, dark, light, useGradient, gradA, gradB, gradAngle, logoDataUrl, brandingEnabled, defaultLogoDataUrl, logoSizePct]);

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await toDataUrl(f);
    setLogoDataUrl(data);
  }

  function downloadSvg() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const s = serializer.serializeToString(svgRef.current);
    const blob = new Blob([s], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qr.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadPng(scale = 1) {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const w = img.width * scale; const h = img.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Draw background for correct light color
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'qr.png';
      a.click();
    };
    img.src = svg64;
  }

  function openLogoPicker() {
    fileRef.current?.click();
  }

  return (
    <div className="container app-shell">
      <header className="mb-6">
        {/* Row 1: Title with subtext inline, with increased spacing */}
        <div className="flex justify-center items-baseline gap-5 md:gap-8 flex-wrap">
          <h1 className="text-2xl font-semibold">QR Generator</h1>
        </div>
        <div>
          <p className="muted">URLs, text, WiFi, vCard, event. Style and export.</p>
        </div>

        {/* Row 2: Grouped toolbar — 2 on the left, 3 on the right */}
        <div className="mt-3 mb-3 grid grid-cols-5 gap-2 lg:flex lg:items-center lg:justify-between">
          {/* Left group: Presets + ECC */}
          <div className="contents lg:flex lg:gap-2">
            <select
              className="btn w-full lg:w-auto"
              onChange={(e) => { const p = presets[Number(e.target.value)]; if (p) p.apply(); e.currentTarget.selectedIndex = 0; }}
            >
              <option value="">Presets</option>
              {presets.map((p, i) => (
                <option key={p.name} value={i}>{p.name}</option>
              ))}
            </select>
            <select
              className="btn w-full lg:w-auto"
              value={ecc}
              onChange={(e) => setEcc(e.target.value as Ecc)}
              title="Error correction"
            >
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H</option>
            </select>
          </div>

          {/* Right group: Import/Remove Logo + Export buttons */}
          <div className="contents lg:flex lg:gap-2 lg:items-center">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickLogo} style={{ display: 'none' }} />
            <button
              className="btn w-full lg:w-auto"
              onClick={() => {
                if (logoDataUrl) {
                  setLogoDataUrl(null);
                } else {
                  openLogoPicker();
                }
              }}
            >
              {logoDataUrl ? 'Remove Logo' : 'Import Logo'}
            </button>
            <button className="btn w-full lg:w-auto" onClick={downloadSvg}>Export SVG</button>
            <button className="btn w-full lg:w-auto lg:col-auto" onClick={() => downloadPng(1)}>Export PNG</button>
          </div>
        </div>
      </header>

      <div className="split">
        {/* Data inputs */}
        <section className="card space-y-4 panel">

          {(mode === 'url' || mode === 'text') && (
            <div>
              <label className="block mb-1 text-sm muted">{mode === 'url' ? 'URL' : 'Text'}</label>
              {mode === 'text' ? (
                <textarea
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 whitespace-pre-wrap"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Hello world"
                />
              ) : (
                <input
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="https://example.com"
                />
              )}
            </div>
          )}

          {mode === 'wifi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm muted">SSID</label>
                  <input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm muted">Encryption</label>
                  <select className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={wifi.encryption} onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as 'WPA' | 'WEP' | 'nopass' })}>
                    <option>WPA</option>
                    <option>WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              </div>
              {wifi.encryption !== 'nopass' && (
                <div>
                  <label className="block mb-1 text-sm muted">Password</label>
                  <input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} />
                </div>
              )}
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })} /> Hidden network</label>
            </div>
          )}

          {mode === 'vcard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">First</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.first} onChange={(e) => setVcard({ ...vcard, first: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">Last</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.last} onChange={(e) => setVcard({ ...vcard, last: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">Org</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.org} onChange={(e) => setVcard({ ...vcard, org: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">Title</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.title} onChange={(e) => setVcard({ ...vcard, title: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">Phone</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.phone} onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">Email</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.email} onChange={(e) => setVcard({ ...vcard, email: e.target.value })} /></div>
              </div>
              <div><label className="block mb-1 text-sm muted">Website</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.url} onChange={(e) => setVcard({ ...vcard, url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">Street</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.street} onChange={(e) => setVcard({ ...vcard, street: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">City</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.city} onChange={(e) => setVcard({ ...vcard, city: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block mb-1 text-sm muted">Region</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.region} onChange={(e) => setVcard({ ...vcard, region: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">ZIP</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.zip} onChange={(e) => setVcard({ ...vcard, zip: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">Country</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={vcard.country} onChange={(e) => setVcard({ ...vcard, country: e.target.value })} /></div>
              </div>
            </div>
          )}

          {mode === 'event' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">Title</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={event.summary} onChange={(e) => setEvent({ ...event, summary: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">Location</label><input className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={event.location} onChange={(e) => setEvent({ ...event, location: e.target.value })} /></div>
              </div>
              <div><label className="block mb-1 text-sm muted">Description</label><textarea className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" rows={2} value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1 text-sm muted">Start</label><input type="datetime-local" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={event.start} onChange={(e) => setEvent({ ...event, start: e.target.value })} /></div>
                <div><label className="block mb-1 text-sm muted">End</label><input type="datetime-local" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={event.end} onChange={(e) => setEvent({ ...event, end: e.target.value })} /></div>
              </div>
            </div>
          )}

          {/* Styling controls moved here */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm muted">Size</label>
              <input type="number" min={128} max={1024} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={size} onChange={(e) => setSize(parseInt(e.target.value || '256'))} />
            </div>
            <div>
              <label className="block mb-1 text-sm muted">Margin</label>
              <input type="number" min={0} max={16} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={margin} onChange={(e) => setMargin(parseInt(e.target.value || '4'))} />
            </div>
          </div>

          

          <div className="grid grid-cols-2 gap-3">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={brandingEnabled} onChange={(e) => setBrandingEnabled(e.target.checked)} /> Show watermark branding</label>
            <div>
              <label className="block mb-1 text-sm muted">Logo size (%)</label>
              <input type="number" min={8} max={30} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={logoSizePct} onChange={(e) => setLogoSizePct(Math.max(8, Math.min(30, parseInt(e.target.value || '18'))))} />
            </div>
          </div>
        </section>

        {/* Color styling + Preview */}
        <section className="card preview">
          {/* Presets + ECC aligned to left of right block */}
          <div className="w-full" style={{maxWidth: 560}}>
            {/* Color controls on the right side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm muted">Dark</label>
                <input type="color" className="w-full h-10 rounded bg-white/5 border border-white/10" value={dark} onChange={(e) => setDark(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm muted">Light</label>
                <input type="color" className="w-full h-10 rounded bg-white/5 border border-white/10" value={light} onChange={(e) => setLight(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={useGradient} onChange={(e) => setUseGradient(e.target.checked)} /> Use gradient</label>
              {useGradient && (
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block mb-1 text-sm muted">Start</label>
                    <input type="color" className="w-full h-9 rounded bg-white/5 border border-white/10" value={gradA} onChange={(e) => setGradA(e.target.value)} />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm muted">End</label>
                    <input type="color" className="w-full h-9 rounded bg-white/5 border border-white/10" value={gradB} onChange={(e) => setGradB(e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="block mb-1 text-sm muted">Gradient angle</label>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      step={1}
                      className="h-5 w-20 px-2 rounded bg-white/5 border border-white/10 text-sm"
                      value={gradAngle}
                      onChange={(e) => setGradAngle(parseInt(e.target.value || '45'))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="qr-target" className="flex items-center justify-center w-full"></div>
        </section>
      </div>

      <footer className="mt-6 text-sm muted">Tip: H level error correction is most robust when embedding a large logo.</footer>
    </div>
  );
}

export default App;
