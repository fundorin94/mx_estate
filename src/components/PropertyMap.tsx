"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapProperty = {
  id: string;
  title: string;
  price_usd: number;
  type: "sale" | "rent";
  lat: number;
  lng: number;
  cover: string | null;
  neighborhood: string | null;
  city: string | null;
};

const MEXICO_CENTER: [number, number] = [-102.5528, 23.6345];
const MEXICO_ZOOM = 4.2;

function formatPrice(price: number, type: "sale" | "rent") {
  if (type === "rent") return `$${(price / 1000).toFixed(1)}k/mo`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(price / 1000)}k`;
}

function renderMarkers(
  map: mapboxgl.Map,
  properties: MapProperty[],
  markersRef: React.MutableRefObject<mapboxgl.Marker[]>,
) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  if (properties.length === 0) {
    map.flyTo({ center: MEXICO_CENTER, zoom: MEXICO_ZOOM });
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();

  for (const p of properties) {
    bounds.extend([p.lng, p.lat]);

    const el = document.createElement("button");
    el.type = "button";
    el.className =
      "px-2 py-1 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-800 cursor-pointer border-2 border-white";
    el.textContent = formatPrice(p.price_usd, p.type);

    const popupNode = document.createElement("div");
    popupNode.innerHTML = `
      <a href="/properties/${p.id}" class="block w-48">
        ${
          p.cover
            ? `<img src="${p.cover}" alt="" class="w-full h-24 object-cover rounded-t" />`
            : `<div class="w-full h-24 bg-gray-100 rounded-t"></div>`
        }
        <div class="p-2">
          <div class="font-semibold text-sm">${formatPrice(p.price_usd, p.type)}</div>
          <div class="text-xs text-gray-700 truncate">${p.title}</div>
          <div class="text-xs text-gray-500 truncate">${[p.neighborhood, p.city].filter(Boolean).join(" · ")}</div>
          <div class="text-xs text-blue-600 mt-1">View →</div>
        </div>
      </a>
    `;

    const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setDOMContent(popupNode);

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map);

    markersRef.current.push(marker);
  }

  if (properties.length === 1) {
    map.flyTo({ center: [properties[0].lng, properties[0].lat], zoom: 13 });
  } else {
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
  }
}

export function PropertyMap({ properties }: { properties: MapProperty[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoadedRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      // eslint-disable-next-line no-console
      console.warn("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: MEXICO_CENTER,
      zoom: MEXICO_ZOOM,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      mapLoadedRef.current = true;
      map.resize();
      renderMarkers(map, properties, markersRef);
    });

    return () => {
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when properties change (after initial load)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    renderMarkers(map, properties, markersRef);
  }, [properties]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] rounded border border-gray-200"
    />
  );
}
