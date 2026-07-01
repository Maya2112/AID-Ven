"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import EstadoBadge from "@/components/ui/EstadoBadge";

export default function AdminView({ usuario }) {
  const [centros, setCentros] = useState([]);
  const [pendientesCatalogo, setPendientesCatalogo] = useState([]);
  const [duplicados, setDuplicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fusionando, setFusionando] = useState(null);

  const fetchCentros = async () => {
    setLoading(true);
    const { data } = await supabase.from("centros_acopio").select("*").order("created_at",{ascending:false});
    setCentros(data||[]);
    setLoading(false);
  };
  const fetchPendientesCatalogo = async () => {
    const { data } = await supabase.from("vista_moderacion_pendientes").select("*");
    setPendientesCatalogo(data||[]);
  };
  const fetchDuplicados = async () => {
    const { data } = await supabase.rpc("admin_detectar_centros_duplicados");
    setDuplicados(data||[]);
  };
  useEffect(()=>{ fetchCentros(); fetchPendientesCatalogo(); fetchDuplicados(); },[]);

  const cambiarEstado = async (id,estado) => {
    await supabase.rpc("cambiar_estado_centro",{p_centro_id:id,p_estado:estado});
    fetchCentros();
  };

  const moderarItem = async (clase, id, estado) => {
    if (clase === "tipo") await supabase.rpc("moderar_tipo_producto", {p_id:id, p_estado:estado});
    else await supabase.rpc("moderar_categoria", {p_id:id, p_estado:estado});
    fetchPendientesCatalogo();
  };

  const fusionar = async (idDuplicado, idCorrecto, nombreDuplicado) => {
    if (!confirm(`¿Fusionar "${nombreDuplicado}" en el otro centro? Todas sus donaciones y cajas se moverán al centro correcto, y este quedará suspendido. Esta acción no se puede deshacer.`)) return;
    setFusionando(idDuplicado);
    const { error } = await supabase.rpc("fusionar_centros", { p_centro_duplicado_id: idDuplicado, p_centro_correcto_id: idCorrecto });
    if (error) alert("No se pudo fusionar: " + error.message);
    setFusionando(null);
    fetchCentros(); fetchDuplicados();
  };

  if(usuario?.rol!=="admin_global") return (
    <div className="content"><div className="empty-state"><div style={{fontSize:48}}>🔑</div><h3>Acceso restringido</h3><p>Solo el administrador global puede ver esta sección.</p></div></div>
  );

  const pendientes=centros.filter(c=>c.estado==="pendiente");

  return (
    <div className="content">
      <div className="page-header"><div className="page-header-text"><h2>Administración</h2><p>Gestión de centros de acopio y catálogo</p></div></div>
      {duplicados.length>0&&<div className="alert alert-error mb-4">⚠️ <strong>{duplicados.length}</strong> posible{duplicados.length>1?"s":""} centro{duplicados.length>1?"s":""} duplicado{duplicados.length>1?"s":""} detectado{duplicados.length>1?"s":""} por nombre similar.</div>}
      {pendientes.length>0&&<div className="alert alert-warning mb-4">⏳ <strong>{pendientes.length}</strong> centro{pendientes.length>1?"s":""} pendiente{pendientes.length>1?"s":""} de aprobación.</div>}
      {pendientesCatalogo.length>0&&<div className="alert alert-warning mb-4">🏷️ <strong>{pendientesCatalogo.length}</strong> tipo{pendientesCatalogo.length>1?"s":""}/categoría{pendientesCatalogo.length>1?"s":""} de producto pendiente{pendientesCatalogo.length>1?"s":""} de revisión.</div>}

      {duplicados.length>0&&(
        <div className="card mb-4">
          <div className="card-header"><h3>⚠️ Posibles Centros Duplicados ({duplicados.length})</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Centro A</th><th>Centro B</th><th>Similitud</th><th>Acción</th></tr></thead>
              <tbody>
                {duplicados.map((d,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{d.nombre_a}</td>
                    <td style={{fontWeight:600}}>{d.nombre_b}</td>
                    <td><span className="badge badge-amber">{Math.round(d.similitud*100)}%</span></td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn btn-danger btn-sm" disabled={fusionando===d.id_a}
                          onClick={()=>fusionar(d.id_a, d.id_b, d.nombre_a)}>
                          Fusionar A → B
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={fusionando===d.id_b}
                          onClick={()=>fusionar(d.id_b, d.id_a, d.nombre_b)}>
                          Fusionar B → A
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 20px",fontSize:11.5,color:"var(--slate-500)"}}>
            "Fusionar A → B" mueve todas las donaciones y cajas de A hacia B, y suspende A. Revisa bien antes de confirmar.
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header"><h3>Tipos y Categorías Pendientes ({pendientesCatalogo.length})</h3></div>
        <div className="table-wrap">
          {pendientesCatalogo.length===0 ? <div className="empty-state" style={{padding:30}}><p className="text-muted">✓ No hay propuestas pendientes</p></div> : (
            <table>
              <thead><tr><th>Tipo</th><th>Nombre</th><th>Pertenece a</th><th>Descripción</th><th>Centro que lo propuso</th><th>Fecha</th><th>Acción</th></tr></thead>
              <tbody>
                {pendientesCatalogo.map(p=>(
                  <tr key={`${p.clase}-${p.id}`}>
                    <td><span className="badge badge-blue">{p.clase==="tipo"?"Tipo":"Categoría"}</span></td>
                    <td style={{fontWeight:600}}>{p.nombre}</td>
                    <td style={{fontSize:12}}>{p.tipo_padre_nombre||"—"}</td>
                    <td style={{fontSize:12,maxWidth:220}}>{p.descripcion||"—"}</td>
                    <td style={{fontSize:12}}>{p.centro_nombre||"—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{new Date(p.created_at).toLocaleDateString("es-MX")}</td>
                    <td><div style={{display:"flex",gap:8}}>
                      <button className="btn btn-success btn-sm" onClick={()=>moderarItem(p.clase,p.id,"aprobado")}>✓ Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>moderarItem(p.clase,p.id,"rechazado")}>✕ Rechazar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><h3>Pendientes de Aprobación ({pendientes.length})</h3></div>
        <div className="table-wrap">
          {pendientes.length===0 ? <div className="empty-state" style={{padding:30}}><p className="text-muted">✓ No hay centros pendientes</p></div> : (
            <table>
              <thead><tr><th>Centro</th><th>Ciudad</th><th>País</th><th>Email</th><th>Teléfono</th><th>Fecha</th><th>Acción</th></tr></thead>
              <tbody>
                {pendientes.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontWeight:600}}>{c.nombre}</td>
                    <td>{c.ciudad}</td><td>{c.pais}</td>
                    <td>{c.contacto_email||"—"}</td><td>{c.contacto_telefono||"—"}</td>
                    <td style={{fontSize:12}}>{new Date(c.created_at).toLocaleDateString("es-MX")}</td>
                    <td><div style={{display:"flex",gap:8}}>
                      <button className="btn btn-success btn-sm" onClick={()=>cambiarEstado(c.id,"aprobado")}>✓ Aprobar</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>cambiarEstado(c.id,"suspendido")}>✕ Rechazar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3>Todos los Centros ({centros.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Centro</th><th>Ubicación</th><th>Estado</th><th>Email</th><th>Registrado</th><th>Acciones</th></tr></thead>
            <tbody>
              {centros.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nombre}</td>
                  <td>{c.ciudad}, {c.pais}</td>
                  <td><EstadoBadge estado={c.estado}/></td>
                  <td style={{fontSize:12}}>{c.contacto_email||"—"}</td>
                  <td style={{fontSize:12}}>{new Date(c.created_at).toLocaleDateString("es-MX")}</td>
                  <td><div style={{display:"flex",gap:6}}>
                    {c.estado!=="aprobado"&&<button className="btn btn-success btn-sm" onClick={()=>cambiarEstado(c.id,"aprobado")}>Aprobar</button>}
                    {c.estado!=="suspendido"&&<button className="btn btn-danger btn-sm" onClick={()=>cambiarEstado(c.id,"suspendido")}>Suspender</button>}
                    {c.estado!=="pendiente"&&<button className="btn btn-ghost btn-sm" onClick={()=>cambiarEstado(c.id,"pendiente")}>Pendiente</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
