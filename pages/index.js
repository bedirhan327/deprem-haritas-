import dynamic from "next/dynamic";
import Head from "next/head";

const Dashboard = dynamic(
  async () => {
    const { useRef, useEffect, useState, useMemo, useCallback } = await import("react");
    const d3 = await import("d3");

    /* ═══ StatCard ═══ */
    function StatCard({ label, value, unit, detail, icon, color, delay }) {
      return (
        <div className={`group relative rounded-xl border border-border-default bg-bg-surface px-4 py-3
                         transition-all duration-300 hover:bg-bg-elevated hover:border-border-hover
                         hover:-translate-y-0.5 a-up ${delay}`}>
          <div className="absolute inset-x-4 top-0 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
               style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div className="flex items-start justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md text-[11px]"
                  style={{ background: `${color}18`, color }}>{icon}</span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className={`text-[32px] font-bold tracking-tighter leading-none a-pop ${delay}`}
                  style={{ color }}>{value}</span>
            {unit && <span className="text-[13px] font-medium text-text-faint mb-0.5">{unit}</span>}
          </div>
          {detail && <p className="mt-1 text-[11px] text-text-faint uppercase tracking-wide truncate">{detail}</p>}
        </div>
      );
    }

    /* ═══ MagBar ═══ */
    function MagBar({ label, count, max, color }) {
      return (
        <div className="flex items-center gap-3">
          <span className="w-7 text-[12px] font-mono text-text-muted flex-shrink-0">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
            <div className="h-full rounded-full transition-all duration-[1s] ease-out"
                 style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, background: color }} />
          </div>
          <span className="w-8 text-right text-[12px] font-mono text-text-muted flex-shrink-0">{count}</span>
        </div>
      );
    }

    /* ═══ EqItem ═══ */
    function EqItem({ eq, idx, getColor }) {
      const ml = parseFloat(eq.ML || eq.ml) || 0;
      const color = getColor(ml);
      return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-default
                         transition-all duration-200 hover:bg-bg-elevated hover:border-border-hover
                         hover:-translate-x-0.5 cursor-default a-up d${Math.min(idx + 1, 10)}`}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold font-mono border"
               style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
            {ml.toFixed(1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-text-primary truncate">
              {eq.Yer || eq.yer || "Bilinmiyor"}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-text-faint font-mono">
              <span>{eq.Tarih || eq.tarih}</span>
              <span className="text-border-default">·</span>
              <span>{eq.Saat || eq.saat}</span>
              <span className="text-border-default">·</span>
              <span>{eq.Derinlik || eq.derinlik} km</span>
            </div>
          </div>
        </div>
      );
    }

    /* ═══ Dashboard ═══ */
    function DashboardClient() {
      const svgRef = useRef(null);
      const tipRef = useRef(null);
      const [limit, setLimit] = useState(500);
      const [geoData, setGeoData] = useState(null);
      const [depremData, setDepremData] = useState([]);
      const [loading, setLoading] = useState(true);
      const [time, setTime] = useState("");

      const seismicColor = useCallback((ml) => {
        if (ml >= 6) return "#F87171";
        if (ml >= 4) return "#FB923C";
        if (ml >= 2) return "#FBBF24";
        return "#34D399";
      }, []);

      useEffect(() => {
        (async () => {
          try {
            const [geo, dep] = await Promise.all([
              d3.json("https://raw.githubusercontent.com/bedirhan327/deprem-haritas-/main/public/data/turkey-geojson.json"),
              d3.json("https://raw.githubusercontent.com/bedirhan327/deprem-veri-collector/main/public/data/deprem_data.json"),
            ]);
            setGeoData(geo);
            setDepremData(dep);
          } catch (e) { console.error(e); }
          finally { setLoading(false); }
        })();
      }, []);

      useEffect(() => {
        const tick = () => setTime(new Date().toLocaleString("tr-TR", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      }, []);

      const stats = useMemo(() => {
        if (!depremData.length) return null;
        const data = depremData.slice(0, limit);
        const mags = data.map((d) => parseFloat(d.ML || d.ml) || 0);
        const depths = data.map((d) => parseFloat(d.Derinlik || d.derinlik) || 0);
        const maxMag = Math.max(...mags);
        const maxItem = data.find((d) => parseFloat(d.ML || d.ml) === maxMag);
        return {
          total: data.length,
          avgMag: (mags.reduce((a, b) => a + b, 0) / mags.length).toFixed(1),
          maxMag: maxMag.toFixed(1),
          maxLoc: maxItem ? (maxItem.Yer || maxItem.yer || "-").substring(0, 32) : "-",
          avgDepth: (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1),
          minDepth: Math.min(...depths).toFixed(0),
          maxDepth: Math.max(...depths).toFixed(0),
          above4: data.filter((d) => parseFloat(d.ML || d.ml) >= 4).length,
          dist: {
            calm: data.filter((d) => parseFloat(d.ML || d.ml) < 2).length,
            mild: data.filter((d) => { const m = parseFloat(d.ML || d.ml); return m >= 2 && m < 4; }).length,
            strong: data.filter((d) => { const m = parseFloat(d.ML || d.ml); return m >= 4 && m < 6; }).length,
            critical: data.filter((d) => parseFloat(d.ML || d.ml) >= 6).length,
          },
        };
      }, [depremData, limit]);

      const recentQuakes = useMemo(() => depremData.slice(0, 25), [depremData]);
      const distMax = stats ? Math.max(stats.dist.calm, stats.dist.mild, stats.dist.strong, stats.dist.critical, 1) : 1;

      /* ── D3 Map ── */
      useEffect(() => {
        if (!geoData || !depremData.length || !svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const box = svgRef.current.parentElement;
        const w = box.clientWidth, h = box.clientHeight;
        svg.attr("viewBox", `0 0 ${w} ${h}`).selectAll("*").remove();

        /* saf siyah bg */
        svg.append("rect").attr("width", w).attr("height", h).attr("fill", "#09090B");

        /* ince grid */
        const defs = svg.append("defs");
        const pat = defs.append("pattern").attr("id", "grid")
          .attr("width", 50).attr("height", 50).attr("patternUnits", "userSpaceOnUse");
        pat.append("path").attr("d", "M 50 0 L 0 0 0 50")
          .attr("fill", "none").attr("stroke", "#27272A").attr("stroke-width", 0.4);
        svg.append("rect").attr("width", w).attr("height", h).attr("fill", "url(#grid)");

        /* glow */
        const f = defs.append("filter").attr("id", "glow")
          .attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
        f.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "b");
        const fm = f.append("feMerge");
        fm.append("feMergeNode").attr("in", "b");
        fm.append("feMergeNode").attr("in", "SourceGraphic");

        const proj = d3.geoMercator().center([35.5, 39])
          .scale(Math.min(w, h) * 4.5).translate([w / 2, h / 2]);
        const path = d3.geoPath().projection(proj);
        const g = svg.append("g");

        /* iller — nötr gri dolgu, beyaz çizgi */
        g.selectAll("path").data(geoData.features).join("path")
          .attr("d", path)
          .attr("fill", "#18181B")
          .attr("stroke", "#52525B")
          .attr("stroke-width", 0.6);

        const data = depremData.slice(0, limit)
          .sort((a, b) => (parseFloat(a.ML || a.ml) || 0) - (parseFloat(b.ML || b.ml) || 0));

        g.selectAll("circle").data(data).join("circle")
          .attr("cx", (d) => { const c = proj([d.Boylam, d.Enlem]); return c ? c[0] : -99; })
          .attr("cy", (d) => { const c = proj([d.Boylam, d.Enlem]); return c ? c[1] : -99; })
          .attr("r", (d) => Math.max((parseFloat(d.ML || d.ml) || 1) * 2.5, 2))
          .attr("fill", (d) => seismicColor(parseFloat(d.ML || d.ml) || 0))
          .attr("fill-opacity", 0.7)
          .attr("stroke", (d) => seismicColor(parseFloat(d.ML || d.ml) || 0))
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.9)
          .attr("filter", (d) => (parseFloat(d.ML || d.ml) || 0) >= 4 ? "url(#glow)" : null)
          .style("cursor", "pointer")
          .on("mouseenter", function (ev, d) {
            const tip = tipRef.current; if (!tip) return;
            const ml = parseFloat(d.ML || d.ml) || 0;
            const col = seismicColor(ml);
            d3.select(this).transition().duration(120)
              .attr("fill-opacity", 1).attr("r", Math.max(ml * 4, 5));
            tip.innerHTML = `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="display:inline-flex;height:28px;min-width:28px;align-items:center;justify-content:center;border-radius:6px;font-family:var(--font-mono);font-size:13px;font-weight:800;background:${col}18;color:${col};padding:0 4px">${ml.toFixed(1)}</span>
                <span style="font-weight:600;font-size:13px;color:#FAFAFA">${d.Yer || d.yer || "Bilinmiyor"}</span>
              </div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:12px">
                <span style="color:#A1A1AA">Derinlik</span><span style="font-family:var(--font-mono);color:#D4D4D8">${d.Derinlik || d.derinlik || "-"} km</span>
                <span style="color:#A1A1AA">Tarih</span><span style="font-family:var(--font-mono);color:#D4D4D8">${d.Tarih || d.tarih || "-"}</span>
                <span style="color:#A1A1AA">Saat</span><span style="font-family:var(--font-mono);color:#D4D4D8">${d.Saat || d.saat || "-"}</span>
              </div>`;
            tip.classList.add("visible");
          })
          .on("mousemove", function (ev) {
            const tip = tipRef.current; if (!tip) return;
            const r = box.getBoundingClientRect();
            let x = ev.clientX - r.left + 14, y = ev.clientY - r.top - 8;
            if (x + 240 > r.width) x -= 260;
            if (y + 110 > r.height) y -= 120;
            tip.style.left = x + "px"; tip.style.top = y + "px";
          })
          .on("mouseleave", function (ev, d) {
            const tip = tipRef.current; if (tip) tip.classList.remove("visible");
            d3.select(this).transition().duration(120)
              .attr("fill-opacity", 0.7).attr("r", Math.max((parseFloat(d.ML || d.ml) || 1) * 2.5, 2));
          });

        svg.call(
          d3.zoom().scaleExtent([0.8, 14]).on("zoom", (ev) => {
            const t = ev.transform;
            g.attr("transform", t);
            g.selectAll("circle")
              .attr("r", (d) => Math.max((parseFloat(d.ML || d.ml) || 1) * 2.5 / t.k, 1.2))
              .attr("stroke-width", 0.5 / t.k);
            g.selectAll("path").attr("stroke-width", 0.6 / t.k);
          })
        );
      }, [geoData, depremData, limit, seismicColor]);

      return (
        <div className="grid h-screen w-screen grid-cols-[280px_1fr_310px] grid-rows-[auto_1fr_auto] overflow-hidden bg-bg-base">

          {/* ═══ HEADER ═══ */}
          <header className="col-span-3 flex items-center justify-between px-5 py-3
                             bg-bg-surface border-b border-border-default a-down">

            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[16px] font-extrabold tracking-tight text-text-primary">Türkiye Deprem Haritası</h1>
                <p className="text-[12px] text-text-faint mt-0.5">Gerçek Zamanlı Sismik Aktivite Takip Sistemi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                   style={{ background: "#F8717112", borderColor: "#F8717130" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "#F87171", animation: "pulse-live 2s ease-in-out infinite" }} />
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#F87171" }}>Canlı</span>
              </div>

              <div className="flex gap-1 rounded-lg bg-bg-base border border-border-default p-1">
                {[100, 500, 1000].map((n) => (
                  <button key={n} onClick={() => setLimit(n)}
                    className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                      limit === n
                        ? "bg-text-primary text-bg-base"
                        : "text-text-muted hover:text-text-secondary hover:bg-bg-elevated"
                    }`}>
                    Son {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[12px] font-mono text-text-faint tabular-nums">{time}</div>
          </header>

          {/* ═══ LEFT SIDEBAR ═══ */}
          <aside className="flex flex-col gap-2.5 overflow-y-auto p-4 pr-2 a-sl">
            <span className="px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-text-faint mb-1">
              İSTATİSTİKLER
            </span>

            {stats ? (
              <>
                <StatCard label="Toplam Deprem" value={stats.total} detail={`Son ${limit} kayıt`}
                          icon="📍" color="#E4E4E7" delay="d1" />
                <StatCard label="Ort. Büyüklük" value={stats.avgMag} unit="ML" detail="Yerel Büyüklük"
                          icon="📐" color="#34D399" delay="d2" />
                <StatCard label="En Büyük Deprem" value={stats.maxMag} unit="ML" detail={stats.maxLoc}
                          icon="⚠️" color="#F87171" delay="d3" />
                <StatCard label="4+ Büyüklük" value={stats.above4} detail="Hissedilen depremler"
                          icon="🔔" color="#FBBF24" delay="d4" />
                <StatCard label="Ort. Derinlik" value={stats.avgDepth} unit="km"
                          detail={`Min ${stats.minDepth} — Maks ${stats.maxDepth} km`}
                          icon="🔽" color="#C084FC" delay="d5" />

                <div className="rounded-xl bg-bg-surface border border-border-default px-4 py-4
                               transition-all duration-300 hover:bg-bg-elevated hover:border-border-hover a-up d6 mt-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">
                    Büyüklük Dağılımı
                  </span>
                  <div className="mt-4 flex flex-col gap-3">
                    <MagBar label="< 2"  count={stats.dist.calm}     max={distMax} color="#34D399" />
                    <MagBar label="2–4"  count={stats.dist.mild}     max={distMax} color="#FBBF24" />
                    <MagBar label="4–6"  count={stats.dist.strong}   max={distMax} color="#FB923C" />
                    <MagBar label="6+"   count={stats.dist.critical} max={distMax} color="#F87171" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-[100px] rounded-xl bg-bg-surface border border-border-default animate-pulse" />
                ))}
              </div>
            )}
          </aside>

          {/* ═══ MAP ═══ */}
          <main className="relative border-x border-border-default overflow-hidden a-up d2">
            {loading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-bg-base gap-4">
                <div className="h-10 w-10 rounded-full border-[3px] border-border-default border-t-text-primary"
                     style={{ animation: "spin 0.7s linear infinite" }} />
                <span className="text-sm text-text-muted font-medium">Deprem verileri yükleniyor...</span>
              </div>
            )}

            <svg ref={svgRef} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" />

            <div ref={tipRef}
                 className="map-tip rounded-xl px-4 py-3 min-w-[220px] border shadow-2xl shadow-black/50"
                 style={{ background: "#18181B", borderColor: "#3F3F46" }} />

            <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-border-default px-4 py-3"
                 style={{ background: "rgba(9,9,11,0.92)", backdropFilter: "blur(12px)" }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-faint">Büyüklük</span>
              <div className="mt-2 flex gap-4">
                {[
                  { color: "#34D399", label: "< 2.0" },
                  { color: "#FBBF24", label: "2 – 4" },
                  { color: "#FB923C", label: "4 – 6" },
                  { color: "#F87171", label: "6 +" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color, boxShadow: `0 0 8px ${l.color}40` }} />
                    <span className="text-[11px] font-medium text-text-secondary">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 z-10 rounded-lg border border-border-default px-3 py-2
                            text-[11px] font-mono text-text-faint"
                 style={{ background: "rgba(9,9,11,0.88)", backdropFilter: "blur(12px)" }}>
              Scroll → Yakınlaştır
            </div>
          </main>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <aside className="flex flex-col overflow-hidden p-4 pl-2 a-sr">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-faint">SON DEPREMLER</span>
              <span className="text-[11px] font-mono text-text-faint bg-bg-surface border border-border-default px-2 py-0.5 rounded">{recentQuakes.length}</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
              {recentQuakes.map((eq, i) => (
                <EqItem key={i} eq={eq} idx={i} getColor={seismicColor} />
              ))}
            </div>
          </aside>

          {/* ═══ FOOTER ═══ */}
          <footer className="col-span-3 flex items-center justify-between px-5 py-2
                             bg-bg-surface border-t border-border-default a-up d4">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-text-faint">Built with</span>
              {["Next.js", "D3.js", "Tailwind", "Airflow"].map((t) => (
                <span key={t} className="rounded-md bg-bg-base border border-border-default px-2.5 py-0.5 text-[10px] font-mono text-text-muted">{t}</span>
              ))}
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[11px] text-text-faint">Veri: Kandilli Rasathanesi & AFAD</span>
              <a href="https://github.com/bedirhan327" target="_blank" rel="noopener noreferrer"
                 className="text-[11px] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
            </div>
          </footer>
        </div>
      );
    }

    return DashboardClient;
  },
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Türkiye Deprem Haritası | Gerçek Zamanlı Sismik Aktivite</title>
        <meta name="description" content="Türkiye'deki son depremleri gerçek zamanlı takip edin. İnteraktif harita, istatistikler ve detaylı deprem verileri." />
      </Head>
      <Dashboard />
    </>
  );
}
