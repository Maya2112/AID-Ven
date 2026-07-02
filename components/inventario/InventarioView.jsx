"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { claseFilaEstado } from "@/lib/constants";
import LeyendaEstados from "@/components/ui/LeyendaEstados";
import ModalDonacion from "./ModalDonacion";
import ModalAsignarCaja from "./ModalAsignarCaja";

export default function InventarioView({ centro, tipos, categorias, tiposParaCaptura, categoriasParaCaptura, catalogo, onCatalogoChange, esAdmin }) {
  const [donaciones, setDonaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [asignandoCaja, setAsignandoCaja] = useState(null);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("donaciones")
      .select("*, caja:cajas_embalaje(numero_caja)").eq("centro_id",centro.id).order("fecha_ingreso",{ascending:false});
    setDonaciones(data||[]);
    setLoading(false);
  },[centro.id]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  // Suscripcion en tiempo real: si otro voluntario del mismo centro registra,
  // edita o elimina una donacion desde otro dispositivo, esta vista se refresca sola.
  useEffect(() => {
    const channel = supabase
      .channel(`donaciones-centro-${centro.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "donaciones", filter: `centro_id=eq.${centro.id}` },
        () => { fetchAll(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [centro.id, fetchAll]);

  const getNombre = (id,arr) => arr.find(a=>a.id===id)?.nombre||"—";
  const filtradas = donaciones.filter(d=>{
    if(filtroTipo!=="all"&&d.tipo_id!==filtroTipo) return false;
    if(filtroEstado!=="all"&&d.estado!==filtroEstado) return false;
    if(busqueda&&!d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const cambiarEstado = async (id,estado) => {
    setError("");
    const { error: err } = await supabase.from("donaciones").update({estado}).eq("id",id);
    if (err) { setError("No se pudo cambiar el estado: " + err.message); return; }
    setDonaciones(prev=>prev.map(d=>d.id===id?{...d,estado}:d));
  };
  const eliminar = async id => {
    if(!confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    setError("");
    const { error: err } = await supabase.from("donaciones").delete().eq("id",id);
    if (err) { setError("No se pudo eliminar: " + err.message); return; }
    setDonaciones(prev=>prev.filter(d=>d.id!==id));
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Inventario de Donativos</h2>
          <p>{donaciones.length} registros en {centro.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)} disabled={centro.estado!=="aprobado"}>＋ Nueva Donación</button>
      </div>
      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}
      <div className="card card-pad mb-4">
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div className="field" style={{flex:"1 1 200px"}}><label>Buscar</label><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Nombre del producto..."/></div>
          <div className="field" style={{flex:"0 0 200px"}}><label>Tipo</label>
            <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
              <option value="all">Todos los tipos</option>
              {tipos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="field" style={{flex:"0 0 180px"}}><label>Estado</label>
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
              <option value="all">Todos</option>
              <option value="recibido">Recibido</option>
              <option value="clasificado">Clasificado</option>
              <option value="empacado">Empacado</option>
              <option value="listo_para_envio">Listo para envío</option>
              <option value="enviado">Enviado</option>
            </select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3>Registros ({filtradas.length})</h3></div>
        <div style={{padding:"14px 20px 0"}}><LeyendaEstados/></div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtradas.length===0 ? <div className="empty-state"><h3>Sin resultados</h3><p>Ajusta los filtros para ver registros.</p></div>
          : (
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Producto</th><th>Conc.</th><th>Unidad/Talla</th><th>Cant.</th><th>Uds.Mín.</th><th>Peso(kg)</th><th>Caja</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {filtradas.map(d=>(
                  <tr key={d.id} className={claseFilaEstado(d.estado)}>
                    <td style={{whiteSpace:"nowrap",fontSize:12}}>{d.fecha_ingreso}</td>
                    <td><span className="badge badge-slate" style={{fontSize:11}}>{getNombre(d.tipo_id,tipos)}</span></td>
                    <td style={{fontSize:12}}>{getNombre(d.categoria_id,categorias)}</td>
                    <td style={{fontWeight:500}}>{d.nombre_producto}</td>
                    <td style={{fontSize:12}}>{d.presentacion_mg||"—"}</td>
                    <td style={{fontSize:12}}>{d.unidad}{d.talla?` · ${d.talla}`:""}</td>
                    <td style={{fontWeight:600}}>{d.cantidad_total?.toLocaleString()}</td>
                    <td style={{fontSize:12}}>{d.total_unidades_minimas>d.cantidad_total?d.total_unidades_minimas?.toLocaleString():"—"}</td>
                    <td style={{fontSize:12}}>{parseFloat(d.peso_total_kg||0).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>setAsignandoCaja(d)}>
                        {d.caja?.numero_caja || "＋ asignar"}
                      </button>
                    </td>
                    <td>
                      <select value={d.estado} onChange={e=>cambiarEstado(d.id,e.target.value)}
                        style={{fontSize:11,padding:"3px 6px",border:"1px solid var(--slate-200)",borderRadius:4,cursor:"pointer"}}>
                        <option value="recibido">Recibido</option>
                        <option value="clasificado">Clasificado</option>
                        <option value="empacado">Empacado</option>
                        <option value="listo_para_envio">Listo p/envío</option>
                        <option value="enviado">Enviado</option>
                      </select>
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={()=>eliminar(d.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showModal&&<ModalDonacion onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);fetchAll();}} tipos={tiposParaCaptura} categorias={categoriasParaCaptura} catalogo={catalogo} centroId={centro.id} onCatalogoChange={onCatalogoChange} esAdmin={esAdmin}/>}
      {asignandoCaja&&(
        <ModalAsignarCaja
          donacion={asignandoCaja}
          centroId={centro.id}
          onClose={()=>setAsignandoCaja(null)}
          onSaved={()=>{setAsignandoCaja(null);fetchAll();}}
        />
      )}
    </div>
  );
}

