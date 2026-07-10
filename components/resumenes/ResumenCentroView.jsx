"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Ico from "@/components/ui/Ico";
import EstadoBadge from "@/components/ui/EstadoBadge";
import { cargarJsPDF, dibujarEncabezadoPDF, dibujarStatsGrandesPDF, dibujarPiePDF, cargarImagenComoDataURL } from "@/lib/pdf";
import { NAVY_RGB } from "@/lib/constants";

export default function ResumenCentroView({ centro, tipos }) {
  const [modo, setModo] = useState("donaciones"); // "donaciones" (estimado) | "cajas" (real)
  const [data, setData] = useState([]);
  const [dataCajas, setDataCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});
  const [exportando, setExportando] = useState(false);
  const [exportandoCajas, setExportandoCajas] = useState(false);

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      supabase.from("vista_resumen_centro").select("*").eq("centro_id",centro.id),
      supabase.from("vista_cajas_resumen").select("*").eq("centro_id",centro.id),
    ]);
    setData(d1||[]);
    setDataCajas(d2||[]);
    setLoading(false);
  },[centro.id]);

  useEffect(()=>{ fetchResumen(); },[fetchResumen]);

  // Suscripcion en tiempo real: cambios en donaciones o cajas de este centro
  // refrescan el resumen automáticamente.
  useEffect(() => {
    const channel = supabase
      .channel(`resumen-centro-${centro.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "donaciones", filter: `centro_id=eq.${centro.id}` }, () => fetchResumen())
      .on("postgres_changes", { event: "*", schema: "public", table: "cajas_embalaje", filter: `centro_id=eq.${centro.id}` }, () => fetchResumen())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id, fetchResumen]);

  const toggle = id => setExpandidos(e=>({...e,[id]:!e[id]}));
  const fuenteActual = modo === "donaciones" ? data : dataCajas;

  const porTipo = {};
  fuenteActual.forEach(r=>{ if(!porTipo[r.tipo_id]) porTipo[r.tipo_id]={nombre:r.tipo_nombre,icono:r.tipo_icono,items:[]}; porTipo[r.tipo_id].items.push(r); });

  const totalCant = modo==="donaciones" ? data.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0) : dataCajas.reduce((s,r)=>s+(parseInt(r.total_cajas)||0),0);
  const totalPeso = fuenteActual.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
  const totalVol = fuenteActual.reduce((s,r)=>s+(parseFloat(r.volumen_total_m3)||0),0);

  const exportarPDF = async () => {
    setExportando(true);
    try {
      const [jsPDF, logoDataUrl] = await Promise.all([
        cargarJsPDF(),
        centro.logo_url ? cargarImagenComoDataURL(centro.logo_url) : Promise.resolve(null),
      ]);
      const doc = new jsPDF();
      let y = dibujarEncabezadoPDF(doc, {
        titulo: "Resumen de mi Centro",
        subtitulo: centro.nombre,
        fuenteLabel: modo === "donaciones" ? "Estimado (donaciones)" : "Real (cajas embaladas)",
        logoDataUrl,
      });

      // Portada: números grandes + desglose de peso por tipo, igual que el
      // resumen ejecutivo que se comparte con aerolíneas/donantes.
      y = dibujarStatsGrandesPDF(doc, y, [
        { label: "Toneladas", value: (totalPeso/1000).toFixed(1), color: [37,99,235] },
        { label: modo==="donaciones"?"Unidades":"Cajas", value: totalCant.toLocaleString(), color: [217,119,6] },
      ]);
      doc.setFontSize(9);
      doc.setTextColor(...NAVY_RGB);
      doc.setFont(undefined, "bold");
      doc.text(
        `Peso total aproximado: ${totalPeso.toLocaleString(undefined,{maximumFractionDigits:1})} kg · ${totalCant.toLocaleString()} ${modo==="donaciones"?"unidades":"cajas"} · ${totalVol.toFixed(2)} m³ · ${Object.keys(porTipo).length} tipos con stock`,
        14, y
      );
      y += 6;

      const paginasAntesDeLaTabla = doc.internal.getNumberOfPages();
      const pesoPorTipo = Object.values(porTipo)
        .map(g => ({ nombre: g.nombre, peso: g.items.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0) }))
        .sort((a,b) => b.peso - a.peso);
      doc.autoTable({
        startY: y, head: [["Qué es","Peso"]],
        body: pesoPorTipo.map(t => [t.nombre, `${t.peso.toLocaleString(undefined,{maximumFractionDigits:0})} kg`]),
        theme: "plain", headStyles: { fillColor: NAVY_RGB, textColor: 255, fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 }, alternateRowStyles: { fillColor: [248,250,252] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        foot: [["TOTAL", `${totalPeso.toLocaleString(undefined,{maximumFractionDigits:0})} kg`]],
        footStyles: { fillColor: [220,230,241], textColor: NAVY_RGB, fontStyle: "bold", fontSize: 8.5, halign: "right" },
      });
      doc.setFontSize(7.5);
      doc.setTextColor(148,163,184);
      doc.setFont(undefined, "normal");
      const notaY = doc.lastAutoTable.finalY + 6;
      doc.text("Pesos aproximados, solo de referencia. El detalle completo, partida por partida, está en las páginas siguientes.", 14, notaY);

      // Detalle: la tabla completa desglosada por tipo y categoría, en página aparte.
      // Si la tabla de portada ya se desbordó sola a una página nueva (autoTable la
      // paginó), no forzamos otro salto encima — seguimos en esa misma página para
      // no dejar una página casi vacía de más.
      let y2;
      if (doc.internal.getNumberOfPages() === paginasAntesDeLaTabla) {
        doc.addPage();
        y2 = 20;
      } else {
        y2 = notaY + 10;
      }
      doc.setFontSize(12);
      doc.setTextColor(...NAVY_RGB);
      doc.setFont(undefined, "bold");
      doc.text("Detalle por tipo y categoría", 14, y2);
      y2 += 6;

      const rows = [];
      Object.values(porTipo).forEach(grupo => {
        grupo.items.forEach(r => {
          if (modo === "donaciones") {
            rows.push([grupo.nombre, r.categoria_nombre, r.total_registros, parseInt(r.cantidad_total).toLocaleString(), parseInt(r.cant_listo||0), parseFloat(r.peso_total_kg||0).toFixed(2)]);
          } else {
            rows.push([grupo.nombre, r.categoria_nombre, r.total_cajas, parseFloat(r.peso_total_kg||0).toFixed(2), parseFloat(r.volumen_total_m3||0).toFixed(4), r.cajas_listas||0]);
          }
        });
      });
      const headers = modo === "donaciones"
        ? [["Tipo","Categoría","Registros","Total","Listo p/envío","Peso (kg)"]]
        : [["Tipo","Categoría","Cajas","Peso (kg)","Volumen (m³)","Listas p/envío"]];

      doc.autoTable({
        startY: y2, head: headers, body: rows,
        theme: "plain", headStyles: { fillColor: NAVY_RGB, textColor: 255, fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5 }, alternateRowStyles: { fillColor: [248,250,252] },
        margin: { left: 14, right: 14 },
      });
      dibujarPiePDF(doc, `AcopioVen · ${centro.nombre}`);
      doc.save(`resumen_centro_${modo}_${centro.nombre.replace(/\s+/g,"_")}.pdf`);
    } catch(e) {
      alert("No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.");
    }
    setExportando(false);
  };

  // Detallado por caja: cada caja con su lista de productos (como el manifiesto
  // que se entrega a aerolíneas/aduana), más un bloque final de lo que aún no
  // se ha empacado (donaciones sin caja asignada = "inventario a granel").
  const exportarDetalladoCajas = async () => {
    setExportandoCajas(true);
    try {
      const [jsPDF, logoDataUrl, { data: cajas, error: errCajas }, { data: donaciones, error: errDonaciones }] = await Promise.all([
        cargarJsPDF(),
        centro.logo_url ? cargarImagenComoDataURL(centro.logo_url) : Promise.resolve(null),
        supabase.from("cajas_embalaje").select("*").eq("centro_id", centro.id).order("numero_caja"),
        supabase.from("donaciones").select("*").eq("centro_id", centro.id).order("created_at"),
      ]);
      if (errCajas || errDonaciones) {
        alert("No se pudo generar el PDF: " + (errCajas?.message || errDonaciones?.message));
        setExportandoCajas(false);
        return;
      }

      const porCaja = {};
      (donaciones||[]).forEach(d => {
        const key = d.caja_id || "_granel";
        if (!porCaja[key]) porCaja[key] = [];
        porCaja[key].push(d);
      });

      // Las filas de encabezado de caja se distinguen de las de producto por su propia
      // forma (col. Producto vacía) — no hace falta llevar un índice aparte sincronizado.
      const body = [];
      const agregarBloque = (etiqueta, pesoTotal, items) => {
        body.push([etiqueta, "", "", "", `${pesoTotal.toFixed(1)} kg`]);
        items.forEach(d => {
          body.push(["", d.nombre_producto, d.cantidad_total?.toLocaleString()||"", d.unidad||"", parseFloat(d.peso_total_kg||0).toFixed(2)]);
        });
      };

      (cajas||[]).forEach(c => {
        const items = porCaja[c.id] || [];
        const tieneNumero = c.numero_caja != null && c.numero_caja !== "";
        agregarBloque(tieneNumero ? `CAJA ${c.numero_caja}` : "CAJA (sin número)", parseFloat(c.peso_kg||0), items);
      });
      const granel = porCaja["_granel"] || [];
      if (granel.length > 0) {
        const pesoGranel = granel.reduce((s,d)=>s+(parseFloat(d.peso_total_kg)||0),0);
        agregarBloque("INVENTARIO A GRANEL (sin caja)", pesoGranel, granel);
      }

      const doc = new jsPDF();
      let y = dibujarEncabezadoPDF(doc, {
        titulo: "Detallado por Caja",
        subtitulo: centro.nombre,
        fuenteLabel: `${(cajas||[]).length} cajas${granel.length?" + inventario a granel":""}`,
        logoDataUrl,
      });
      doc.autoTable({
        startY: y, head: [["Caja","Producto","Cant.","Unidad","Peso (kg)"]], body,
        theme: "plain", headStyles: { fillColor: NAVY_RGB, textColor: 255, fontSize: 8.5 },
        bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 },
        didParseCell: (d) => {
          if (d.section === "body" && d.row.raw[1] === "") {
            d.cell.styles.fillColor = [220,230,241];
            d.cell.styles.textColor = NAVY_RGB;
            d.cell.styles.fontStyle = "bold";
          }
        },
      });
      dibujarPiePDF(doc, `AcopioVen · ${centro.nombre} · Detallado por caja`);
      doc.save(`detallado_cajas_${centro.nombre.replace(/\s+/g,"_")}.pdf`);
    } catch(e) {
      alert("No se pudo generar el PDF. Revisa tu conexión e intenta de nuevo.");
    }
    setExportandoCajas(false);
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text"><h2>Resumen de mi Centro</h2><p>Conteo consolidado de {centro.nombre}</p></div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportarDetalladoCajas} disabled={exportandoCajas || loading}>
            {exportandoCajas ? <><span className="spinner"/> Generando...</> : "↓ Detallado por Caja"}
          </button>
          <button className="btn btn-success" onClick={exportarPDF} disabled={exportando || loading}>
            {exportando ? <><span className="spinner"/> Generando...</> : "↓ Exportar PDF"}
          </button>
        </div>
      </div>

      <div className="type-tabs mb-4">
        <button className={`type-tab ${modo==="donaciones"?"active":""}`} onClick={()=>setModo("donaciones")}>📊 Donaciones (estimado)</button>
        <button className={`type-tab ${modo==="cajas"?"active":""}`} onClick={()=>setModo("cajas")}>📦 Cajas de embalaje (real)</button>
      </div>

      <div className="stats-grid mb-6">
        <div className="stat-card accent-blue"><div className="stat-label">{modo==="donaciones"?"Total unidades":"Total cajas"}</div><div className="stat-value">{totalCant.toLocaleString()}</div></div>
        <div className="stat-card accent-amber"><div className="stat-label">Peso total</div><div className="stat-value">{totalPeso.toFixed(1)}</div><div className="stat-sub">kilogramos</div></div>
        <div className="stat-card accent-navy"><div className="stat-label">Volumen total</div><div className="stat-value">{totalVol.toFixed(3)}</div><div className="stat-sub">m³</div></div>
        <div className="stat-card accent-green"><div className="stat-label">Tipos con stock</div><div className="stat-value">{Object.keys(porTipo).length}</div></div>
      </div>

      {loading ? <div className="empty-state"><p>Calculando resumen...</p></div>
      : Object.keys(porTipo).length===0 ? (
        <div className="empty-state">
          <div style={{fontSize:48}}>{modo==="donaciones"?"📊":"📦"}</div>
          <h3>Sin datos</h3>
          <p>{modo==="donaciones" ? "Registra donaciones para ver el resumen." : "Registra cajas de embalaje para ver el resumen real."}</p>
        </div>
      )
      : Object.entries(porTipo).map(([tipoId,grupo])=>{
        const subtotalCant = modo==="donaciones"
          ? grupo.items.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0)
          : grupo.items.reduce((s,r)=>s+(parseInt(r.total_cajas)||0),0);
        const subtotalPeso=grupo.items.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
        return (
          <div key={tipoId} className="tipo-section">
            <div className="tipo-header" onClick={()=>toggle(tipoId)}>
              <h3><Ico name={grupo.icono} size={16}/> {grupo.nombre}</h3>
              <div className="tipo-meta">
                <span><strong>{subtotalCant.toLocaleString()}</strong> {modo==="donaciones"?"uds":"cajas"}</span>
                <span><strong>{subtotalPeso.toFixed(1)}</strong> kg</span>
                <span>{expandidos[tipoId]?"▲":"▼"}</span>
              </div>
            </div>
            {expandidos[tipoId]&&(
              <div className="tipo-body">
                {modo === "donaciones" ? (
                  <table>
                    <thead><tr><th>Categoría</th><th>Registros</th><th>Total</th><th>Recibido</th><th>Empacado</th><th>Listo</th><th>Enviado</th><th>Peso(kg)</th><th>Vol(m³)</th></tr></thead>
                    <tbody>
                      {grupo.items.map(r=>(
                        <tr key={r.categoria_id}>
                          <td style={{fontWeight:500}}>{r.categoria_nombre}</td>
                          <td>{r.total_registros}</td>
                          <td style={{fontWeight:600}}>{parseInt(r.cantidad_total).toLocaleString()}</td>
                          <td>{parseInt(r.cant_recibido||0)}</td>
                          <td>{parseInt(r.cant_empacado||0)}</td>
                          <td><span className="badge badge-green">{parseInt(r.cant_listo||0)}</span></td>
                          <td>{parseInt(r.cant_enviado||0)}</td>
                          <td>{parseFloat(r.peso_total_kg||0).toFixed(2)}</td>
                          <td>{parseFloat(r.volumen_total_m3||0).toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table>
                    <thead><tr><th>Categoría</th><th>Total cajas</th><th>Empacadas</th><th>Listas p/envío</th><th>Enviadas</th><th>Peso(kg)</th><th>Vol(m³)</th></tr></thead>
                    <tbody>
                      {grupo.items.map(r=>(
                        <tr key={r.categoria_id}>
                          <td style={{fontWeight:500}}>{r.categoria_nombre}</td>
                          <td style={{fontWeight:600}}>{parseInt(r.total_cajas).toLocaleString()}</td>
                          <td>{parseInt(r.cajas_empacadas||0)}</td>
                          <td><span className="badge badge-green">{parseInt(r.cajas_listas||0)}</span></td>
                          <td>{parseInt(r.cajas_enviadas||0)}</td>
                          <td>{parseFloat(r.peso_total_kg||0).toFixed(2)}</td>
                          <td>{parseFloat(r.volumen_total_m3||0).toFixed(4)}</td>
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
