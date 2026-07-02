"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import EstadoBadge from "@/components/ui/EstadoBadge";
import Ico from "@/components/ui/Ico";
import ModalDonacion from "@/components/inventario/ModalDonacion";

export default function Dashboard({ centro, tipos, categorias, tiposParaCaptura, categoriasParaCaptura, catalogo, onCatalogoChange, esAdmin }) {
  const [donaciones, setDonaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchDonaciones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("donaciones")
      .select("*").eq("centro_id",centro.id).order("created_at",{ascending:false}).limit(10);
    setDonaciones(data||[]);
    setLoading(false);
  },[centro.id]);

  useEffect(()=>{ fetchDonaciones(); },[fetchDonaciones]);

  // Suscripcion en tiempo real: refleja cambios de otros voluntarios del mismo centro al instante.
  useEffect(() => {
    const channel = supabase
      .channel(`dashboard-centro-${centro.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "donaciones", filter: `centro_id=eq.${centro.id}` },
        () => { fetchDonaciones(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id, fetchDonaciones]);

  const getNombre = (id, arr) => arr.find(a=>a.id===id)?.nombre||"—";
  const peso = donaciones.reduce((s,d)=>s+(parseFloat(d.peso_total_kg)||0),0);
  const listos = donaciones.filter(d=>d.estado==="listo_para_envio").length;

  return (
    <div>
      {centro.estado==="pendiente"&&(
        <div className="pending-banner">
          ⏳ Tu centro está <strong>pendiente de aprobación</strong>. Una vez aprobado podrás registrar donaciones.
        </div>
      )}
      <div className="content">
        <div className="page-header">
          <div className="page-header-text">
            <h2>Panel Principal</h2>
            <p>Centro de acopio: <strong>{centro.nombre}</strong></p>
          </div>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)} disabled={centro.estado!=="aprobado"}>
            ＋ Nueva Donación
          </button>
        </div>
        <div className="stats-grid">
          <div className="stat-card accent-blue"><div className="stat-label">Registros recientes</div><div className="stat-value">{loading?"…":donaciones.length}</div></div>
          <div className="stat-card accent-green"><div className="stat-label">Listos para envío</div><div className="stat-value">{loading?"…":listos}</div></div>
          <div className="stat-card accent-amber"><div className="stat-label">Peso total (kg)</div><div className="stat-value">{loading?"…":peso.toFixed(1)}</div></div>
          <div className="stat-card accent-navy"><div className="stat-label">Centro</div><div className="stat-value" style={{fontSize:16,paddingTop:4}}><EstadoBadge estado={centro.estado}/></div></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Últimas 10 donaciones</h3></div>
          <div className="table-wrap">
            {loading ? <div className="empty-state"><p>Cargando...</p></div>
            : donaciones.length===0 ? (
              <div className="empty-state">
                <div style={{fontSize:48}}>📦</div>
                <h3>Sin donaciones aún</h3>
                <p>Usa &ldquo;Nueva Donación&rdquo; para empezar a registrar los insumos que llegan.</p>
              </div>
            ) : (
              <table>
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Producto</th><th>Presentación</th><th>Unidad</th><th>Cantidad</th><th>Peso Total</th><th>Estado</th></tr></thead>
                <tbody>
                  {donaciones.map(d=>(
                    <tr key={d.id}>
                      <td style={{whiteSpace:"nowrap"}}>{d.fecha_ingreso}</td>
                      <td>{getNombre(d.tipo_id,tipos)}</td>
                      <td>{getNombre(d.categoria_id,categorias)}</td>
                      <td style={{fontWeight:500}}>{d.nombre_producto}</td>
                      <td>{d.presentacion_mg||<span className="text-muted">—</span>}</td>
                      <td>{d.unidad}{d.talla?` (${d.talla})`:""}</td>
                      <td style={{fontWeight:600}}>{d.cantidad_total?.toLocaleString()}</td>
                      <td>{d.peso_total_kg?`${parseFloat(d.peso_total_kg).toFixed(2)} kg`:"—"}</td>
                      <td><EstadoBadge estado={d.estado}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {showModal&&<ModalDonacion onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);fetchDonaciones();}} tipos={tiposParaCaptura} categorias={categoriasParaCaptura} catalogo={catalogo} centroId={centro.id} onCatalogoChange={onCatalogoChange} esAdmin={esAdmin}/>}
    </div>
  );
}
