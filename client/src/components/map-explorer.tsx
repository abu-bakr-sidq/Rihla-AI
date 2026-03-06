import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Point {
  lat: number;
  lng: number;
  title: string;
  description: string;
}

interface MapExplorerProps {
  points?: Point[];
  center?: [number, number];
}

// Component to handle automatic bounding box fitting
function MapBounds({ points }: { points: Point[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  
  return null;
}

export function MapExplorer({ points = [], center = [0, 0] }: MapExplorerProps) {
  // If no points provided, just show a nice default view
  const mapCenter: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : center;
  
  return (
    <div className="h-full w-full relative z-0 rounded-2xl overflow-hidden border border-border shadow-lg">
      <MapContainer 
        center={mapCenter} 
        zoom={4} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {points.map((point, idx) => (
          <Marker key={idx} position={[point.lat, point.lng]}>
            <Popup className="rounded-xl">
              <div className="font-sans">
                <h3 className="font-bold text-foreground mb-1 font-display">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {points.length > 1 && <MapBounds points={points} />}
      </MapContainer>
      
      {points.length === 0 && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-[400]">
          <MapPin className="w-12 h-12 text-primary/50 mb-4 animate-bounce" />
          <h3 className="font-display font-bold text-xl text-foreground">Map generating</h3>
          <p className="text-muted-foreground text-sm mt-2">AI is plotting your coordinates...</p>
        </div>
      )}
    </div>
  );
}
