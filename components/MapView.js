'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { catOf } from '@/lib/constants';

export default function MapView({ shops, me, selectedId, onPick }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null);
  useEffect(() => {
    // Default centre: Indiranagar, Bengaluru. Zoom 12 keeps the main areas visible.
    map.current = L.map(el.current, { zoomControl: false }).setView([12.9784, 77.6408], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    shops.forEach((s) => {
      const c = catOf(s.category), sel = s.id === selectedId;
      const letter = (s.name[0] || '?').replace(/[<>&"]/g, '');
      const icon = L.divIcon({ className: '', iconSize: [44, 44], iconAnchor: [22, 22],
        html: `<div style="width:44px;height:44px;border-radius:50%;background:${c.bg};color:${c.fg};border:3px solid ${sel ? '#15141A' : '#fff'};box-shadow:0 6px 14px rgba(40,30,30,.25);display:flex;align-items:center;justify-content:center;font:700 17px Outfit,sans-serif">${letter}</div>` });
      L.marker([s.lat, s.lng], { icon, alt: s.name }).on('click', () => onPick(s)).addTo(layer.current);
    });
    if (me) L.circleMarker([me.lat, me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#15141A', fillOpacity: 1 }).addTo(layer.current);
  }, [shops, me, selectedId, onPick]);
  useEffect(() => { if (map.current && me) map.current.setView([me.lat, me.lng], 15); }, [me]);
  return <div ref={el} className="h-full w-full" />;
}
