"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Home() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 600;

    // SVG temizle (yeniden render engellemek için)
    svg.selectAll("*").remove();

    Promise.all([
      d3.json("/data/turkey-geojson.json"),
      d3.json("/data/deprem_data.json"),
    ]).then(([geoData, depremData]) => {
      const projection = d3
        .geoMercator()
        .center([33, 39.2])
        .scale(3000)
        .translate([width / 2, height / 2 + 50]);

      const path = d3.geoPath().projection(projection);

      // Tüm öğeleri tek grup içine al
      const mapGroup = svg.append("g").attr("class", "map-group");

      // Türkiye sınırlarını çiz
      mapGroup
        .selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path)
        .attr("class", "province")
        .attr("fill", "#eeeeee")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

      // İl isimleri
      mapGroup
        .selectAll("text")
        .data(geoData.features)
        .join("text")
        .attr("transform", (d) => {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .text((d) => d.properties.name);

      // Renk fonksiyonu
      function getColor(ml) {
        if (ml >= 6) return "#d73027";
        else if (ml >= 4) return "#fc8d59";
        else if (ml >= 2) return "#fee08b";
        else return "#91cf60";
      }

      // Deprem verilerini sırala
      depremData.sort((a, b) => a.ML - b.ML);

      // Deprem balonlarını çiz
      mapGroup
        .selectAll("circle")
        .data(depremData)
        .join("circle")
        .attr("cx", (d) => projection([d.Boylam, d.Enlem])[0])
        .attr("cy", (d) => projection([d.Boylam, d.Enlem])[1])
        .attr("r", (d) => (d.ML ? d.ML * 3.5 : 3))
        .attr("fill", (d) => getColor(d.ML))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.1)
        .attr("opacity", 0.8)
        .append("title")
        .text((d) => 
           `Yer: ${d.Yer || d.yer}\nML: ${d.ML || d.ml}\nDerinlik: ${d.Derinlik || d.derinlik} km`
        );


      // Zoom ve Pan
      const zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          const { transform } = event;
          mapGroup.attr("transform", transform);

          // Zoom ile balon boyutlarını ayarla
          mapGroup
            .selectAll("circle")
            .attr("r", (d) =>
              d.ML ? (d.ML * 3.5) / transform.k : 3 / transform.k
            );
        });

      svg.call(zoom);
    });
  }, []);

  return (
    <div
      style={{
        margin: 0,
        background: "#f9f9f9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100vh"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        style={{
          display: "block",
          margin: 0,
          overflow: "visible",
          backgroundColor: "#f8f9fa",
          maxWidth: "1200px",
          aspectRatio: "16/9",
        }}
      ></svg>
    </div>
  );
}
