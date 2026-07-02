"use client";
import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import { claseFilaEstado } from "@/lib/constants";
import ModalCaja from "./ModalCaja";
import EstadoBadge from "@/components/ui/EstadoBadge";
import LeyendaEstados from "@/components/ui/LeyendaEstados";

export default function CajasEmbalajeView({ centro, tipos, categorias }) {
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [error, setError] = useState("");
  const [expandida, setExpandida] = useState(null);
  const [contenidoPorCaja, setContenidoPorCaja] = useState({});
  const contenidoPorCajaRef = useRef(contenidoPorCaja);
  contenidoPorCajaRef.current = contenidoPorCaja;

  const cargarContenidoCaja = async (cajaId) => {
    const { data } = await supabase.from("donaciones").select("*").eq("caja_id", cajaId).order("fecha_ingreso");
    setContenidoPorCaja(prev => ({ ...prev, [cajaId]: data || [] }));
  };

  const toggleExpandir = (cajaId) => {
    if (expandida === cajaId) { setExpandida(null); return; }
    setExpandida(cajaId);
    if (!contenidoPorCaja[cajaId]) cargarContenidoCaja(cajaId);
  };

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("cajas_embalaje")
      .select("*").eq("centro_id", centro.id).order("created_at", { ascending: false });
    setCajas(data || []);
    setLoading(false);
  }, [centro.id]);

  useEffect(() => { fetchCajas(); }, [fetchCajas]);

  // Suscripcion en tiempo real: si otro voluntario del mismo centro registra,
  // edita o elimina una caja desde otro dispositivo, esta vista se refresca sola.
  useEffect(() => {
    const channel = supabase
      .channel(`cajas-centro-${centro.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "cajas_embalaje", filter: `centro_id=eq.${centro.id}` },
        () => { fetchCajas(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id, fetchCajas]);

  // Si otro dispositivo agrega/quita una donación de una caja que este dispositivo
  // ya tiene expandida (previsualizando su contenido), se refresca ese contenido —
  // si no, el peso de la fila cambiaría en vivo pero la lista de abajo quedaría vieja.
  useEffect(() => {
    const channel = supabase
      .channel(`cajas-donaciones-centro-${centro.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "donaciones", filter: `centro_id=eq.${centro.id}` },
        (payload) => {
          const afectadas = [payload.new?.caja_id, payload.old?.caja_id].filter(Boolean);
          afectadas.filter(id => contenidoPorCajaRef.current[id]).forEach(id => cargarContenidoCaja(id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id]);

  const getNombre = (id, arr) => arr.find(a=>a.id===id)?.nombre || "—";
  const filtradas = filtroTipo === "all" ? cajas : cajas.filter(c=>c.tipo_id===filtroTipo);

  const totalPeso = filtradas.reduce((s,c)=>s+(parseFloat(c.peso_kg)||0),0);
  const totalVol = filtradas.reduce((s,c)=>s+(parseFloat(c.volumen_m3)||0),0);

  const cambiarEstado = async (id, estado) => {
    setError("");
    const { error: err } = await supabase.from("cajas_embalaje").update({estado}).eq("id", id);
    if (err) { setError("No se pudo cambiar el estado: " + err.message); return; }
    setCajas(prev=>prev.map(c=>c.id===id?{...c,estado}:c));
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta caja registrada? No se puede deshacer.")) return;
    setError("");
    const { error: err } = await supabase.from("cajas_embalaje").delete().eq("id", id);
    if (err) { setError("No se pudo eliminar: " + err.message); return; }
    setCajas(prev=>prev.filter(c=>c.id!==id));
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Lista de Cajas</h2>
          <p>Peso y volumen real medido de cada caja física empacada · {centro.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditando(null);setShowModal(true);}} disabled={centro.estado!=="aprobado"}>
          ＋ Registrar Caja
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      <div className="stats-grid">
        <div className="stat-card accent-blue">
          <div className="stat-label">Total de cajas</div>
          <div className="stat-value">{filtradas.length}</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Peso real total</div>
          <div className="stat-value">{totalPeso.toFixed(2)}</div>
          <div className="stat-sub">kg</div>
        </div>
        <div className="stat-card accent-navy">
          <div className="stat-label">Volumen real total</div>
          <div className="stat-value">{totalVol.toFixed(3)}</div>
          <div className="stat-sub">m³</div>
        </div>
      </div>

      <div className="card card-pad mb-4">
        <div className="field" style={{maxWidth:260}}>
          <label>Filtrar por tipo</label>
          <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {tipos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Cajas registradas ({filtradas.length})</h3></div>
        <div style={{padding:"14px 20px 0"}}><LeyendaEstados estados={["empacado","listo_para_envio","enviado"]}/></div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtradas.length===0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Sin cajas registradas</h3>
              <p>Cuando empaquen una caja física, regístrala aquí con su peso y volumen real medido.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th></th><th>Caja</th><th>Tipo</th><th>Categoría</th><th>Contenido</th>
                  <th>Dimensiones (cm)</th><th>Volumen (m³)</th><th>Peso (kg)</th>
                  <th>Fecha</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c=>{
                  const abierta = expandida === c.id;
                  const contenido = contenidoPorCaja[c.id];
                  return (
                  <Fragment key={c.id}>
                  <tr className={claseFilaEstado(c.estado)}>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>toggleExpandir(c.id)} title="Ver contenido">
                        {abierta ? "▼" : "▶"}
                      </button>
                    </td>
                    <td style={{fontWeight:600}}>{c.numero_caja || "—"}</td>
                    <td style={{fontSize:12}}>{getNombre(c.tipo_id, tipos)}</td>
                    <td style={{fontSize:12}}>{getNombre(c.categoria_id, categorias)}</td>
                    <td style={{fontSize:12,maxWidth:200}}>{c.contenido_resumen || "—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>
                      {c.largo_cm&&c.ancho_cm&&c.alto_cm ? `${c.largo_cm}×${c.ancho_cm}×${c.alto_cm}` : "—"}
                    </td>
                    <td style={{fontSize:12}}>{c.volumen_m3 ? parseFloat(c.volumen_m3).toFixed(5) : "—"}</td>
                    <td style={{fontWeight:600}}>
                      {c.peso_kg==null ? "—" : parseFloat(c.peso_kg).toFixed(2)}
                      {c.peso_auto && c.peso_kg!=null && <span className="badge badge-blue" style={{fontSize:9,marginLeft:5,verticalAlign:"middle"}}>auto</span>}
                      {c.peso_desactualizado && <span className="badge badge-amber" style={{fontSize:9,marginLeft:5,verticalAlign:"middle"}} title="El contenido cambió después del último peso medido — verifica en báscula">⚠️ verificar</span>}
                    </td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{c.fecha_empaque}</td>
                    <td>
                      <select value={c.estado} onChange={e=>cambiarEstado(c.id,e.target.value)}
                        style={{fontSize:11,padding:"3px 6px",border:"1px solid var(--slate-200)",borderRadius:4,cursor:"pointer"}}>
                        <option value="empacado">Empacado</option>
                        <option value="listo_para_envio">Listo p/envío</option>
                        <option value="enviado">Enviado</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={()=>{setEditando(c);setShowModal(true);}}>✎</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>eliminar(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                  {abierta && (
                    <tr>
                      <td colSpan={10} style={{background:"var(--slate-50)",padding:"10px 16px"}}>
                        {!contenido ? (
                          <p className="hint">Cargando contenido...</p>
                        ) : contenido.length===0 ? (
                          <p className="hint">Esta caja no tiene donaciones vinculadas todavía.</p>
                        ) : (
                          <table>
                            <thead><tr><th>Producto</th><th>Presentación</th><th>Unidad</th><th>Cant.</th><th>Peso(kg)</th><th>Estado</th></tr></thead>
                            <tbody>
                              {contenido.map(d=>(
                                <tr key={d.id}>
                                  <td style={{fontSize:12,fontWeight:500}}>{getNombre(d.tipo_id,tipos)} · {d.nombre_producto}</td>
                                  <td style={{fontSize:12}}>{d.presentacion_mg||"—"}</td>
                                  <td style={{fontSize:12}}>{d.unidad}{d.talla?` · ${d.talla}`:""}</td>
                                  <td style={{fontSize:12}}>{d.cantidad_total?.toLocaleString()}</td>
                                  <td style={{fontSize:12}}>{parseFloat(d.peso_total_kg||0).toFixed(2)}</td>
                                  <td><EstadoBadge estado={d.estado}/></td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{fontWeight:700}}>
                                <td colSpan={3} style={{textAlign:"right",fontSize:11.5,paddingRight:10}}>Totales:</td>
                                <td style={{fontSize:12}}>{contenido.reduce((s,d)=>s+(d.cantidad_total||0),0).toLocaleString()}</td>
                                <td style={{fontSize:12}}>{contenido.reduce((s,d)=>s+(parseFloat(d.peso_total_kg)||0),0).toFixed(2)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ModalCaja
          onClose={()=>{setShowModal(false);setEditando(null);}}
          onSaved={()=>{
            // El contenido pudo cambiar (donaciones agregadas/quitadas): se refresca el cache
            // si esa caja está siendo previsualizada, o simplemente se descarta si no.
            if (editando) {
              if (expandida === editando.id) cargarContenidoCaja(editando.id);
              else setContenidoPorCaja(prev => { const next = {...prev}; delete next[editando.id]; return next; });
            }
            setShowModal(false);setEditando(null);fetchCajas();
          }}
          tipos={tipos} categorias={categorias} centroId={centro.id}
          cajaExistente={editando}
        />
      )}
    </div>
  );
}
