"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Home() {
  const svgRef = useRef(null);

useEffect(() => {
  const svg = d3.select(svgRef.current);
  const width = 1000, height = 600;

  const drawMap = (depremData) => {
    svg.selectAll("*").remove();
    d3.json("/turkey-geojson.json").then((geoData) => {
      const projection = d3.geoMercator()
        .center([33, 39.2])
        .scale(3000)
        .translate([width / 2, height / 2 + 50]);
      const path = d3.geoPath().projection(projection);

      const mapGroup = svg.append("g").attr("class", "map-group");

      // Türkiye sınırları
      mapGroup.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", "#eeeeee")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

      // İl isimleri
      mapGroup.selectAll("text")
        .data(geoData.features)
        .join("text")
        .attr("transform", d => {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]}, ${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .text(d => d.properties.name);

      // Deprem balonları
      const getColor = ml => ml >=6 ? "#d73027" : ml>=4 ? "#fc8d59" : ml>=2 ? "#fee08b" : "#91cf60";
      mapGroup.selectAll("circle")
        .data(depremData)
        .join("circle")
        .attr("cx", d => projection([d.Boylam, d.Enlem])[0])
        .attr("cy", d => projection([d.Boylam, d.Enlem])[1])
        .attr("r", d => d.ML ? d.ML*3.5 : 3)
        .attr("fill", d => getColor(d.ML))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.1)
        .attr("opacity", 0.8)
        .append("title")
        .text(d => `Yer: ${d.Yer}\nML: ${d.ML}\nDerinlik: ${d["Derinlik(km)"]} km`);

      // 🔹 Zoom & Pan
      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          const { transform } = event;
          mapGroup.attr("transform", transform);

          mapGroup.selectAll("circle")
            .attr("r", d => d.ML ? (d.ML*3.5)/transform.k : 3/transform.k);
        });

      svg.call(zoom);
    });
  };

  // Başlangıç ve her dakika veri çek
  const fetchData = () => {
    d3.json("/data/deprem_data.json").then(drawMap);
  };

  fetchData();
  const interval = setInterval(fetchData, 60000);
  return () => clearInterval(interval);
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
