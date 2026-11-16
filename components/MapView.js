'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { catOf } from '@/lib/constants';

const SIZE = 44;

// Markers on (almost) the same spot are fanned out in a small ring so none is hidden.
function spread(shops) {
  const groups = {};
  shops.forEach((s) => {
    const k = `${Number(s.lat).toFixed(4)},${Number(s.lng).toFixed(4)}`;
    (groups[k] = groups[k] || []).push(s);
  });
  const out = [];
  Object.values(groups).forEach((g) => {
    g.forEach((s, i) => {
      if (g.length === 1) return out.push({ s, dx: 0, dy: 0 });
      const a = (2 * Math.PI * i) / g.length - Math.PI / 2, r = 14 + g.length * 4;
      out.push({ s, dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r) });
    });
  });
  return out;
}

export default function MapView({ shops, me, selectedId, onPick }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), fitted = useRef(false);
  useEffect(() => {
    // Default centre: Indiranagar, Bengaluru. Zoom 12 keeps the main areas visible.
    map.current = L.map(el.current, { zoomControl: false }).setView([12.9784, 77.6408], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    const ro = new ResizeObserver(() => map.current && map.current.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); map.current.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    spread(shops).forEach(({ s, dx, dy }) => {
      const c = catOf(s.category), sel = s.id === selectedId;
      const letter = (s.name[0] || '?').replace(/[<>&"]/g, '');
      const icon = L.divIcon({ className: '', iconSize: [SIZE, SIZE], iconAnchor: [SIZE / 2 - dx, SIZE / 2 - dy],
        html: `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:50%;background:${c.bg};color:${c.fg};border:3px solid ${sel ? '#15141A' : '#fff'};box-shadow:0 6px 14px rgba(40,30,30,.25);display:flex;align-items:center;justify-content:center;font:700 17px Outfit,sans-serif">${letter}</div>` });
      L.marker([s.lat, s.lng], { icon, alt: s.name, zIndexOffset: sel ? 1000 : 0 }).on('click', () => onPick(s)).addTo(layer.current);
    });
    if (me) L.circleMarker([me.lat, me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#15141A', fillOpacity: 1 }).addTo(layer.current);
  }, [shops, me, selectedId, onPick]);
  useEffect(() => {
    if (!map.current || me || fitted.current || shops.length < 2) return;
    fitted.current = true;
    map.current.fitBounds(L.latLngBounds(shops.map((s) => [s.lat, s.lng])), { padding: [48, 48], maxZoom: 14 });
  }, [shops, me]);
  useEffect(() => { if (map.current && me) map.current.setView([me.lat, me.lng], 15); }, [me]);
  return <div ref={el} className="h-full w-full" />;
}
