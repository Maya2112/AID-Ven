"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cargarJsPDF, dibujarEncabezadoPDF, dibujarStatsPDF, dibujarPiePDF, cargarImagenComoDataURL } from "@/lib/pdf";
import { NAVY_RGB } from "@/lib/constants";

export default function ManifiestoView({ centro, esAdmin }) {
  const [alcance, setAlcance] = useState("centro"); // "centro" | "global" (solo admin)
  const [modo, setModo] = useState("estimado"); // "estimado" | "real"
  const [dataEstimado, setDataEstimado] = useState([]);
  const [dataReal, setDataReal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("listo_para_envio");
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [descartadas, setDescartadas] = useState(new Set()); // ids de cajas excluidas del manifiesto (solo modo "real")

  const fetchManifiesto = useCallback(async () => {
    setLoading(true);
    const tablaEst = alcance === "global" ? "vista_manifiesto_global" : "vista_manifiesto";
    const tablaReal = alcance === "global" ? "vista_manifiesto_real_global" : "vista_manifiesto_real";
    let queryEst = supabase.from(tablaEst).select("*");
    let queryReal = supabase.from(tablaReal).select("*");
    if (alcance === "centro") {
      queryEst = queryEst.eq("centro_id", centro.id);
      queryReal = queryReal.eq("centro_id", centro.id);
    }
    const [{ data: est }, { data: real }] = await Promise.all([queryEst, queryReal]);
    setDataEstimado(est||[]);
    setDataReal(real||[]);
    setLoading(false);
  },[centro.id, alcance]);

  useEffect(()=>{ fetchManifiesto(); },[fetchManifiesto]);

  // Suscripcion en tiempo real: cambios en donaciones/cajas refrescan el manifiesto.
  // En alcance "centro" se filtra por centro_id; en "global" se escucha todo.
  useEffect(() => {
    const filtroCentro = alcance === "centro" ? `centro_id=eq.${centro.id}` : undefined;
    const channel = supabase
      .channel(`manifiesto-${alcance}-${centro.id ?? "global"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "donaciones", ...(filtroCentro?{filter:filtroCentro}:{}) }, () => fetchManifiesto())
      .on("postgres_changes", { event: "*", schema: "public", table: "cajas_embalaje", ...(filtroCentro?{filter:filtroCentro}:{}) }, () => fetchManifiesto())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id, alcance, fetchManifiesto]);

  const data = modo === "estimado" ? dataEstimado : dataReal;
  const filtrados = filtroEstado==="all" ? data : data.filter(d=>d.estado===filtroEstado);

  // Selección de cajas a incluir en el manifiesto (solo modo "real" — trabaja por caja).
  // Se modela como exclusión (opt-out): por defecto todas las que pasan el filtro de
  // estado van incluidas, y el usuario desmarca las que no quiere llevar en este envío.
  // Así una caja nueva que llega por realtime (u otro cambio de datos) entra incluida
  // automáticamente, sin necesitar un efecto que reconstruya la selección y sin riesgo
  // de borrar en silencio lo que el usuario ya había desmarcado.
  const toggleSeleccion = id => setDescartadas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const incluidos = modo === "real" ? filtrados.filter(d=>!descartadas.has(d.id)) : filtrados;
  const totalPeso = modo === "estimado"
    ? incluidos.reduce((s,d)=>s+(parseFloat(d.peso_total_kg)||0),0)
    : incluidos.reduce((s,d)=>s+(parseFloat(d.peso_kg)||0),0);
  const totalVol = modo === "estimado"
    ? incluidos.reduce((s,d)=>s+(parseFloat(d.volumen_total_m3)||0),0)
    : incluidos.reduce((s,d)=>s+(parseFloat(d.volumen_m3)||0),0);

  const tituloAlcance = alcance === "global" ? "Todos los centros aprobados" : `${centro.nombre} → Venezuela`;
  const nombreArchivo = alcance === "global" ? "global" : centro.nombre.replace(/\s+/g,"_");

  const exportCSV = () => {
    let headers, rows;
    const incluyeCentro = alcance === "global";
    if (modo === "estimado") {
      headers=[...(incluyeCentro?["Centro"]:[]),"Tipo","Categoría","Producto","Presentación","Unidad","Talla","Cantidad","Uds.Mín.","Peso Unit.(kg)","Peso Total(kg)","Vol.Total(m³)","Estado","Fecha","Observaciones"];
      rows=incluidos.map(d=>[...(incluyeCentro?[d.centro_nombre]:[]),d.tipo_nombre,d.categoria_nombre,d.nombre_producto,d.presentacion_mg||"",d.unidad,d.talla||"",d.cantidad_total,d.total_unidades_minimas||"",d.peso_unitario_kg??"",d.peso_total_kg??"",d.volumen_total_m3??"",d.estado,d.fecha_ingreso,d.observaciones||""]);
    } else {
      headers=[...(incluyeCentro?["Centro"]:[]),"Caja","Tipo","Categoría","Contenido","Largo(cm)","Ancho(cm)","Alto(cm)","Volumen(m³)","Peso(kg)","Estado","Fecha Empaque","Observaciones"];
      rows=incluidos.map(d=>[...(incluyeCentro?[d.centro_nombre]:[]),d.numero_caja||"",d.tipo_nombre,d.categoria_nombre,d.contenido_resumen||"",d.largo_cm||"",d.ancho_cm||"",d.alto_cm||"",d.volumen_m3||"",d.peso_kg,d.estado,d.fecha_empaque,d.observaciones||""]);
    }
    const csv=[headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url;
    a.download=`manifiesto_${modo}_${nombreArchivo}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportPDF = async () => {
    setExportandoPDF(true);
    try {
      // El logo del centro solo aplica al manifiesto de "Mi centro": en "Global"
      // se mezclan varios centros y no corresponde mostrar un solo logo.
      const [jsPDF, logoDataUrl] = await Promise.all([
        cargarJsPDF(),
        (alcance === "centro" && centro.logo_url) ? cargarImagenComoDataURL(centro.logo_url) : Promise.resolve(null),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      let y = dibujarEncabezadoPDF(doc, {
        titulo: "Manifiesto de Carga",
        subtitulo: tituloAlcance,
        fuenteLabel: modo === "estimado" ? "Estimado (catálogo)" : "Real (cajas embaladas)",
        logoDataUrl,
      });
      y = dibujarStatsPDF(doc, y, [
        { label: "Líneas", value: incluidos.length, color: [37,99,235] },
        { label: modo==="real"?"Peso real (kg)":"Peso bruto (kg)", value: totalPeso.toFixed(2), color: [217,119,6] },
        { label: "Volumen (m³)", value: totalVol.toFixed(4), color: [15,31,61] },
      ]);

      const incluyeCentro = alcance === "global";
      let headers, rows;
      if (modo === "estimado") {
        headers = [...(incluyeCentro?["Centro"]:[]),"Tipo","Categoría","Producto","Unidad","Cantidad","Peso (kg)","Vol (m³)"];
        rows = incluidos.map(d=>[...(incluyeCentro?[d.centro_nombre]:[]),d.tipo_nombre,d.categoria_nombre,d.nombre_producto,d.unidad,d.cantidad_total,parseFloat(d.peso_total_kg||0).toFixed(2),parseFloat(d.volumen_total_m3||0).toFixed(4)]);
      } else {
        headers = [...(incluyeCentro?["Centro"]:[]),"Caja","Tipo","Categoría","Contenido","Peso (kg)","Vol (m³)"];
        rows = incluidos.map(d=>[...(incluyeCentro?[d.centro_nombre]:[]),d.numero_caja||"—",d.tipo_nombre,d.categoria_nombre,d.contenido_resumen||"—",parseFloat(d.peso_kg||0).toFixed(2),d.volumen_m3?parseFloat(d.volumen_m3).toFixed(4):"—"]);
      }
      doc.autoTable({
        startY: y, head: [headers], body: rows,
        theme: "plain", headStyles: { fillColor: NAVY_RGB, textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 7.5 }, alternateRowStyles: { fillColor: [248,250,252] },
        margin: { left: 14, right: 14 },
        foot: [[...(incluyeCentro?[""]:[]), ...(modo==="estimado"?["","TOTALES","",""]:["","TOTALES",""]), totalPeso.toFixed(2), totalVol.toFixed(4)]],
        footStyles: { fillColor: [220,230,241], textColor: NAVY_RGB, fontStyle: "bold", fontSize: 8 },
      });
      dibujarPiePDF(doc, "AcopioVen · Declaración de mercancía: ayuda humanitaria sin fines de lucro");
      doc.save(`manifiesto_${modo}_${nombreArchivo}.pdf`);
    } catch(e) {
      alert("No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.");
    }
    setExportandoPDF(false);
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text"><h2>Manifiesto de Carga</h2><p>Listado para aerolíneas, aduana y logística</p></div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportCSV} disabled={incluidos.length===0}>↓ CSV</button>
          <button className="btn btn-success" onClick={exportPDF} disabled={incluidos.length===0 || exportandoPDF}>
            {exportandoPDF ? <><span className="spinner"/> Generando...</> : "↓ Exportar PDF"}
          </button>
        </div>
      </div>

      {esAdmin && (
        <div className="type-tabs mb-3">
          <button className={`type-tab ${alcance==="centro"?"active":""}`} onClick={()=>setAlcance("centro")}>🏢 Mi centro</button>
          <button className={`type-tab ${alcance==="global"?"active":""}`} onClick={()=>setAlcance("global")}>🌍 Global (todos los centros)</button>
        </div>
      )}

      <div className="type-tabs mb-4">
        <button className={`type-tab ${modo==="estimado"?"active":""}`} onClick={()=>setModo("estimado")}>
          📊 Estimado (catálogo)
        </button>
        <button className={`type-tab ${modo==="real"?"active":""}`} onClick={()=>setModo("real")}>
          📦 Real (cajas embaladas)
        </button>
      </div>
      <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
        {modo === "estimado"
          ? "Calculado con cantidad × peso/volumen unitario del catálogo. Útil para estimar mientras llega la mercancía."
          : "Basado en el peso y volumen REAL medido con báscula y cinta métrica de cada caja ya empacada. Este es el dato más confiable para el manifiesto final."}
      </div>

      <div className="card card-pad mb-4">
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div className="field" style={{width:220}}><label>Estado a incluir</label>
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
              <option value="all">Todos</option>
              <option value="empacado">Empacado</option>
              <option value="listo_para_envio">Listo para envío</option>
              <option value="enviado">Enviado</option>
            </select>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div className="stat-card accent-amber" style={{padding:"10px 16px",minWidth:110}}><div className="stat-label">Peso {modo==="real"?"real":"bruto"}</div><div className="stat-value" style={{fontSize:18}}>{totalPeso.toFixed(2)} kg</div></div>
            <div className="stat-card accent-navy" style={{padding:"10px 16px",minWidth:110}}><div className="stat-label">Volumen</div><div className="stat-value" style={{fontSize:18}}>{totalVol.toFixed(4)} m³</div></div>
            <div className="stat-card accent-blue" style={{padding:"10px 16px",minWidth:80}}><div className="stat-label">{modo==="real"?"Cajas incluidas":"Líneas"}</div><div className="stat-value" style={{fontSize:18}}>{incluidos.length}{modo==="real"?`/${filtrados.length}`:""}</div></div>
          </div>
        </div>
        {modo === "real" && filtrados.length>0 && (
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setDescartadas(new Set())}>Seleccionar todas</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setDescartadas(new Set(filtrados.map(d=>d.id)))}>Ninguna</button>
            <span className="hint" style={{alignSelf:"center"}}>Marca qué cajas van en este manifiesto.</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h3>{tituloAlcance}</h3></div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtrados.length===0 ? <div className="empty-state"><div style={{fontSize:48}}>📋</div><h3>Sin registros para este estado</h3></div>
          : modo === "estimado" ? (
            <table>
              <thead><tr>{alcance==="global"&&<th>Centro</th>}<th>#</th><th>Tipo</th><th>Categoría</th><th>Producto</th><th>Conc.</th><th>Unidad</th><th>Talla</th><th>Cantidad</th><th>Uds.Mín.</th><th>Peso Unit.</th><th>Peso Total</th><th>Volumen</th></tr></thead>
              <tbody>
                {filtrados.map((d,i)=>(
                  <tr key={d.id}>
                    {alcance==="global"&&<td style={{fontSize:12,fontWeight:500}}>{d.centro_nombre}</td>}
                    <td style={{color:"var(--slate-400)",fontSize:11}}>{i+1}</td>
                    <td style={{fontSize:12}}>{d.tipo_nombre}</td>
                    <td style={{fontSize:12}}>{d.categoria_nombre}</td>
                    <td style={{fontWeight:500}}>{d.nombre_producto}</td>
                    <td style={{fontSize:12}}>{d.presentacion_mg||"—"}</td>
                    <td style={{fontSize:12}}>{d.unidad}</td>
                    <td style={{fontSize:12}}>{d.talla||"—"}</td>
                    <td style={{fontWeight:600}}>{d.cantidad_total?.toLocaleString()}</td>
                    <td style={{fontSize:12}}>{d.total_unidades_minimas>d.cantidad_total?d.total_unidades_minimas?.toLocaleString():"—"}</td>
                    <td style={{fontSize:12}}>{d.peso_unitario_kg}</td>
                    <td style={{fontWeight:600}}>{parseFloat(d.peso_total_kg||0).toFixed(3)}</td>
                    <td style={{fontSize:12}}>{parseFloat(d.volumen_total_m3||0).toFixed(5)}</td>
                  </tr>
                ))}
                <tr style={{background:"var(--slate-50)",fontWeight:700}}>
                  <td colSpan={alcance==="global"?11:10} style={{textAlign:"right",color:"var(--navy)",paddingRight:16}}>TOTALES</td>
                  <td style={{color:"var(--navy)"}}>{totalPeso.toFixed(3)} kg</td>
                  <td style={{color:"var(--navy)"}}>{totalVol.toFixed(5)} m³</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table>
              <thead><tr><th></th>{alcance==="global"&&<th>Centro</th>}<th>#</th><th>Caja</th><th>Tipo</th><th>Categoría</th><th>Contenido</th><th>Dimensiones</th><th>Volumen</th><th>Peso Real</th></tr></thead>
              <tbody>
                {filtrados.map((d,i)=>(
                  <tr key={d.id} style={{opacity: descartadas.has(d.id) ? 0.45 : 1}}>
                    <td><input type="checkbox" checked={!descartadas.has(d.id)} onChange={()=>toggleSeleccion(d.id)}/></td>
                    {alcance==="global"&&<td style={{fontSize:12,fontWeight:500}}>{d.centro_nombre}</td>}
                    <td style={{color:"var(--slate-400)",fontSize:11}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{d.numero_caja||"—"}</td>
                    <td style={{fontSize:12}}>{d.tipo_nombre}</td>
                    <td style={{fontSize:12}}>{d.categoria_nombre}</td>
                    <td style={{fontWeight:500,maxWidth:220}}>{d.contenido_resumen||"—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{d.largo_cm&&d.ancho_cm&&d.alto_cm?`${d.largo_cm}×${d.ancho_cm}×${d.alto_cm} cm`:"—"}</td>
                    <td style={{fontSize:12}}>{d.volumen_m3?parseFloat(d.volumen_m3).toFixed(5):"—"}</td>
                    <td style={{fontWeight:600}}>{parseFloat(d.peso_kg||0).toFixed(3)} kg</td>
                  </tr>
                ))}
                <tr style={{background:"var(--slate-50)",fontWeight:700}}>
                  <td colSpan={alcance==="global"?8:7} style={{textAlign:"right",color:"var(--navy)",paddingRight:16}}>TOTALES (seleccionadas)</td>
                  <td style={{color:"var(--navy)"}}>{totalVol.toFixed(5)} m³</td>
                  <td style={{color:"var(--navy)"}}>{totalPeso.toFixed(3)} kg</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
