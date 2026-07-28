"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

const markerIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:linear-gradient(135deg, var(--color-primary), var(--color-accent));border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { score: number };
}

export function LogementMap({ adresse }: { adresse: string }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function geocode() {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`,
        );
        if (!response.ok) {
          throw new Error("geocoding_failed");
        }
        const data = (await response.json()) as { features: BanFeature[] };
        const feature = data.features[0];
        if (!feature) {
          throw new Error("not_found");
        }
        const [lon, lat] = feature.geometry.coordinates;
        if (!cancelled) {
          setPosition([lat, lon]);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
        }
      }
    }

    geocode();
    return () => {
      cancelled = true;
    };
  }, [adresse]);

  if (notFound) {
    return (
      <p className="text-sm text-muted-foreground">
        Impossible de localiser cette adresse sur la carte.
      </p>
    );
  }

  if (!position) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Localisation en cours…
      </div>
    );
  }

  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-border shadow-sm">
      <MapContainer
        center={position}
        zoom={18}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; IGN"
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
          maxNativeZoom={19}
        />
        <TileLayer
          attribution="&copy; IGN — Cadastre"
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
          opacity={0.6}
          maxNativeZoom={19}
        />
        <Marker position={position} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
