"use client"; // React 18+ için client component

import { useEffect } from "react";
import * as d3 from "d3";

export default function Home() {
  useEffect(() => {
    const svg = d3.select("#map");

    // Haritayı çizmek için fonksiyon oluştur
    const drawMap = () => {
      svg.selectAll("*").remove(); // eski haritayı temizle
      const width = svg.node().clientWidth;
      const height = svg.node().clientHeight;

      Promise.all([
        d3.json("/data/turkey-geojson.json"),
        d3.json("/data/deprem_data.json")
      ]).then(([geoData, depremData]) => {
        const projection = d3.geoMercator()
          .center([35.5, 39.2])
          .scale(Math.min(width, height) * 3) // boyuta göre ölçek
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const mapGroup = svg.append("g").attr("class", "map-group");

        // Türkiye sınırlarını çiz
        mapGroup.selectAll("path")
          .data(geoData.features)
          .join("path")
          .attr("d", path)
          .attr("class", "province")
          .attr("fill", "#eeeeee")
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5);

        // Renk skalası
        function getColor(ml) {
          if (ml >= 6) return "#d73027";
          else if (ml >= 4) return "#fc8d59";
          else if (ml >= 2) return "#fee08b";
          else return "#91cf60";
        }

        // Deprem balonları
        depremData.sort((a, b) => a.ML - b.ML);

        mapGroup.selectAll("circle")
          .data(depremData)
          .join("circle")
          .attr("cx", d => projection([d.Boylam, d.Enlem])[0])
          .attr("cy", d => projection([d.Boylam, d.Enlem])[1])
          .attr("r", d => d.ML ? d.ML * 3.5 : 3)
          .attr("fill", d => getColor(d.ML))
          .attr("stroke", "#333")
          .attr("stroke-width", 0.1)
          .attr("opacity", 0.7)
          .append("title")
          .text(d => `Yer: ${d.Yer}\nML: ${d.ML}\nDerinlik: ${d["Derinlik(km)"]} km`);

        // Zoom ve Pan
        const zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on("zoom", (event) => {
            const { transform } = event;
            mapGroup.attr("transform", transform);

            mapGroup.selectAll("circle")
              .attr("r", d => (d.ML ? d.ML * 3.5 / transform.k : 3 / transform.k));
          });

        svg.call(zoom);
      });
    };

    drawMap(); // ilk çizim
    window.addEventListener("resize", drawMap); // pencere boyutu değişince yeniden çiz

    return () => window.removeEventListener("resize", drawMap);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg
        id="map"
        width="100%"
        height="100vh"
        style={{ backgroundColor: "#f8f9fa", display: "block", margin: 0, overflow: "visible" }}
      ></svg>
    </div>
  );
}
