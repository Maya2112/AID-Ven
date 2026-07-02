"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Ico from "@/components/ui/Ico";
import { cargarJsPDF, dibujarEncabezadoPDF, dibujarStatsPDF, dibujarPiePDF } from "@/lib/pdf";
import { NAVY_RGB } from "@/lib/constants";

export default function ResumenGlobalView() {
  const [modo, setModo] = useState("donaciones");
  const [data, setData] = useState([]);
  const [dataCajas, setDataCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});
  const [exportando, setExportando] = useState(false);

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      supabase.from("vista_resumen_global").select("*"),
      supabase.from("vista_cajas_resumen_global").select("*"),
    ]);
    setData(d1||[]);
    setDataCajas(d2||[]);
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchResumen(); },[fetchResumen]);

  // Suscripcion en tiempo real: cualquier cambio en donaciones o cajas
  // de cualquier centro refresca este resumen global.
  useEffect(() => {
    const channel = supabase
      .channel("resumen-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "donaciones" }, () => fetchResumen())
      .on("postgres_changes", { event: "*", schema: "public", table: "cajas_embalaje" }, () => fetchResumen())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchResumen]);

  const toggle = id => setExpandidos(e=>({...e,[id]:!e[id]}));
  const fuenteActual = modo === "donaciones" ? data : dataCajas;
  const porTipo = {};
  fuenteActual.forEach(r=>{ if(!porTipo[r.tipo_id]) porTipo[r.tipo_id]={nombre:r.tipo_nombre,icono:r.tipo_icono,items:[]}; porTipo[r.tipo_id].items.push(r); });
  const totalCant = modo==="donaciones" ? data.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0) : dataCajas.reduce((s,r)=>s+(parseInt(r.total_cajas)||0),0);
  const totalPeso = fuenteActual.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);

  const exportarPDF = async () => {
    setExportando(true);
    try {
      const jsPDF = await cargarJsPDF();
      const doc = new jsPDF();
      let y = dibujarEncabezadoPDF(doc, {
        titulo: "Resumen Global",
        subtitulo: "Todos los centros de acopio aprobados",
        fuenteLabel: modo === "donaciones" ? "Estimado (donaciones)" : "Real (cajas embaladas)",
      });
      y = dibujarStatsPDF(doc, y, [
        { label: modo==="donaciones"?"Total unidades":"Total cajas", value: totalCant.toLocaleString(), color: [37,99,235] },
        { label: "Peso global (kg)", value: totalPeso.toFixed(1), color: [217,119,6] },
        { label: "Tipos de producto", value: Object.keys(porTipo).length, color: [5,150,105] },
      ]);

      const rows = [];
      Object.values(porTipo).forEach(grupo => {
        grupo.items.forEach(r => {
          if (modo === "donaciones") {
            rows.push([grupo.nombre, r.categoria_nombre, r.centros_participantes, parseInt(r.cantidad_total).toLocaleString(), parseInt(r.cant_listo||0), parseFloat(r.peso_total_kg||0).toFixed(2)]);
          } else {
            rows.push([grupo.nombre, r.categoria_nombre, r.centros_participantes, r.total_cajas, parseFloat(r.peso_total_kg||0).toFixed(2), r.cajas_listas||0]);
          }
        });
      });
      const headers = modo === "donaciones"
        ? [["Tipo","Categoría","Centros","Total uds","Listo p/envío","Peso (kg)"]]
        : [["Tipo","Categoría","Centros","Cajas","Peso (kg)","Listas p/envío"]];

      doc.autoTable({
        startY: y, head: headers, body: rows,
        theme: "plain", headStyles: { fillColor: NAVY_RGB, textColor: 255, fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 }, alternateRowStyles: { fillColor: [248,250,252] },
        margin: { left: 14, right: 14 },
      });
      dibujarPiePDF(doc, "AcopioVen · Resumen Global");
      doc.save(`resumen_global_${modo}.pdf`);
    } catch(e) {
      alert("No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.");
    }
    setExportando(false);
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text"><h2>Resumen Global 🌍</h2><p>Suma de todos los centros aprobados — solo lectura</p></div>
        <button className="btn btn-success" onClick={exportarPDF} disabled={exportando || loading}>
          {exportando ? <><span className="spinner"/> Generando...</> : "↓ Exportar PDF"}
        </button>
      </div>
      <div className="alert alert-info mb-4">👁 Vista de solo lectura. Muestra en tiempo real la suma de todos los centros de acopio aprobados.</div>

      <div className="type-tabs mb-4">
        <button className={`type-tab ${modo==="donaciones"?"active":""}`} onClick={()=>setModo("donaciones")}>📊 Donaciones (estimado)</button>
        <button className={`type-tab ${modo==="cajas"?"active":""}`} onClick={()=>setModo("cajas")}>📦 Cajas de embalaje (real)</button>
      </div>

      <div className="stats-grid mb-6">
        <div className="stat-card accent-blue"><div className="stat-label">{modo==="donaciones"?"Total unidades":"Total cajas"} (global)</div><div className="stat-value">{totalCant.toLocaleString()}</div></div>
        <div className="stat-card accent-amber"><div className="stat-label">Peso global</div><div className="stat-value">{totalPeso.toFixed(1)}</div><div className="stat-sub">kg</div></div>
        <div className="stat-card accent-green"><div className="stat-label">Tipos de producto</div><div className="stat-value">{Object.keys(porTipo).length}</div></div>
      </div>

      {loading ? <div className="empty-state"><p>Cargando datos globales...</p></div>
      : Object.keys(porTipo).length===0 ? (
        <div className="empty-state">
          <div style={{fontSize:48}}>🌍</div><h3>Sin datos globales</h3>
          <p>{modo==="donaciones" ? "Aparecerá aquí cuando los centros aprobados registren donaciones." : "Aparecerá aquí cuando los centros aprobados registren cajas de embalaje."}</p>
        </div>
      )
      : Object.entries(porTipo).map(([tipoId,grupo])=>{
        const sub = modo==="donaciones" ? grupo.items.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0) : grupo.items.reduce((s,r)=>s+(parseInt(r.total_cajas)||0),0);
        const subP=grupo.items.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
        return (
          <div key={tipoId} className="tipo-section">
            <div className="tipo-header" onClick={()=>toggle(tipoId)}>
              <h3><Ico name={grupo.icono} size={16}/> {grupo.nombre}</h3>
              <div className="tipo-meta"><span><strong>{sub.toLocaleString()}</strong> {modo==="donaciones"?"uds":"cajas"}</span><span><strong>{subP.toFixed(1)}</strong> kg</span><span>{expandidos[tipoId]?"▲":"▼"}</span></div>
            </div>
            {expandidos[tipoId]&&(
              <div className="tipo-body">
                {modo === "donaciones" ? (
                  <table>
                    <thead><tr><th>Categoría</th><th>Centros</th><th>Total</th><th>Listo p/envío</th><th>Enviado</th><th>Peso(kg)</th></tr></thead>
                    <tbody>
                      {grupo.items.map(r=>(
                        <tr key={r.categoria_id}>
                          <td style={{fontWeight:500}}>{r.categoria_nombre}</td>
                          <td>{r.centros_participantes}</td>
                          <td style={{fontWeight:600}}>{parseInt(r.cantidad_total).toLocaleString()}</td>
                          <td><span className="badge badge-green">{parseInt(r.cant_listo||0).toLocaleString()}</span></td>
                          <td>{parseInt(r.cant_enviado||0).toLocaleString()}</td>
                          <td>{parseFloat(r.peso_total_kg||0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table>
                    <thead><tr><th>Categoría</th><th>Centros</th><th>Cajas</th><th>Listas p/envío</th><th>Enviadas</th><th>Peso(kg)</th></tr></thead>
                    <tbody>
                      {grupo.items.map(r=>(
                        <tr key={r.categoria_id}>
                          <td style={{fontWeight:500}}>{r.categoria_nombre}</td>
                          <td>{r.centros_participantes}</td>
                          <td style={{fontWeight:600}}>{parseInt(r.total_cajas).toLocaleString()}</td>
                          <td><span className="badge badge-green">{parseInt(r.cajas_listas||0)}</span></td>
                          <td>{parseInt(r.cajas_enviadas||0)}</td>
                          <td>{parseFloat(r.peso_total_kg||0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
