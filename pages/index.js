"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function Home() {
  const svgRef = useRef(null);
  const [depremData, setDepremData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [limit, setLimit] = useState(1000);

  useEffect(() => {
    const fetchData = async () => {
      const [geo, deprem] = await Promise.all([
        d3.json(
          "https://raw.githubusercontent.com/bedirhan327/deprem-haritas-/main/public/data/turkey-geojson.json"
        ),
        d3.json(
          "https://raw.githubusercontent.com/bedirhan327/deprem-veri-collector/main/public/data/deprem_data.json"
        ),
      ]);

      setGeoData(geo);
      setDepremData(deprem);
    };

    fetchData(); // sayfa açılır açılmaz veri çek
    const interval = setInterval(fetchData, 20 * 60 * 1000); // 20 dakika

    return () => clearInterval(interval); // component unmount olunca intervali temizle
  }, []);

  useEffect(() => {
    if (!geoData || depremData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 600;
    svg.selectAll("*").remove();

    const projection = d3
      .geoMercator()
      .center([33, 39.2])
      .scale(3000)
      .translate([width / 2, height / 2 + 50]);

    const path = d3.geoPath().projection(projection);
    const mapGroup = svg.append("g").attr("class", "map-group");

    // Türkiye sınırları
    mapGroup
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#eeeeee")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5);

    // Renk fonksiyonu
    function getColor(ml) {
      if (ml >= 6) return "#d73027";
      else if (ml >= 4) return "#fc8d59";
      else if (ml >= 2) return "#fee08b";
      else return "#91cf60";
    }

    const filteredData = depremData.slice(0, limit);
    filteredData.sort((a, b) => a.ML - b.ML);

    // Noktalar
    mapGroup
      .selectAll("circle")
      .data(filteredData)
      .join("circle")
      .attr("cx", (d) => projection([d.Boylam, d.Enlem])[0])
      .attr("cy", (d) => projection([d.Boylam, d.Enlem])[1])
      .attr("r", (d) => (d.ML ? d.ML * 3.5 : 3))
      .attr("fill", (d) => getColor(d.ML))
      .attr("stroke", "#333")
      .attr("stroke-width", 0.1)
      .attr("opacity", 0.8)
      .append("title")
      .text(
        (d) =>
          `Yer: ${d.Yer || d.yer}
ML: ${d.ML || d.ml}
Derinlik: ${d.Derinlik || d.derinlik} km
Tarih: ${d.Tarih || d.tarih}
Saat: ${d.Saat || d.saat}`
      );

    // Zoom & Pan
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        const { transform } = event;
        mapGroup.attr("transform", transform);
        mapGroup
          .selectAll("circle")
          .attr("r", (d) =>
            d.ML ? (d.ML * 3.5) / transform.k : 3 / transform.k
          );
      });

    svg.call(zoom);
  }, [geoData, depremData, limit]);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#f9f9f9",
        position: "relative",
      }}
    >
      {/* Harita */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          backgroundColor: "#f8f9fa",
        }}
      ></svg>

      {/* Üstte Sabit, Şeffaf Menü */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          padding: "8px 16px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          backdropFilter: "blur(5px)",
          zIndex: 1000,
        }}
      >
        {[100, 500, 1000].map((num) => (
          <button
            key={num}
            onClick={() => setLimit(num)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: limit === num ? "2px solid #333" : "1px solid #aaa",
              backgroundColor: limit === num ? "#e0e0e0" : "#fff",
              cursor: "pointer",
              fontWeight: limit === num ? "bold" : "normal",
              transition: "all 0.2s ease-in-out",
            }}
          >
            Son {num}
          </button>
        ))}
      </div>
    </div>
  );
}
