import { ComposableMap, Geographies, Geography } from "react-simple-maps";
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function BackgroundMap() {
  return (
    <div className="absolute inset-0 w-full h-full opacity-50 pointer-events-none scale-125">
      <ComposableMap
        className="w-full h-full"
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth={0.6}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
