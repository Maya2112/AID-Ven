"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import EstadoBadge from "@/components/ui/EstadoBadge";

export default function AdminView({ usuario }) {
  const esSuperAdmin = usuario?.rol === "admin_global";
  const esAdminCiudad = usuario?.rol === "admin_ciudad";
  const miCiudad = usuario?.ciudad_asignada || null;

  const [centros, setCentros] = useState([]);
  const [pendientesCatalogo, setPendientesCatalogo] = useState([]);
  const [duplicados, setDuplicados] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fusionando, setFusionando] = useState(null);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState(null);
  const [ciudadParaCodigo, setCiudadParaCodigo] = useState("");
  const [asignandoAdmin, setAsignandoAdmin] = useState(false);
  const [nuevoAdminEmail, setNuevoAdminEmail] = useState("");
  const [nuevoAdminCiudad, setNuevoAdminCiudad] = useState("");
  const [error, setError] = useState("");

  const fetchCentros = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("centros_acopio").select("*").order("created_at",{ascending:false});
    if (esAdminCiudad && miCiudad) query = query.eq("ciudad", miCiudad);
    const { data, error: err } = await query;
    if (err) setError("No se pudieron cargar los centros: " + err.message);
    else setCentros(data||[]);
    setLoading(false);
  }, [esAdminCiudad, miCiudad]);
  const fetchPendientesCatalogo = useCallback(async () => {
    const { data, error: err } = await supabase.from("vista_moderacion_pendientes").select("*");
    if (err) setError("No se pudieron cargar las propuestas pendientes: " + err.message);
    else setPendientesCatalogo(data||[]);
  }, []);
  const fetchDuplicados = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("admin_detectar_centros_duplicados");
    if (err) setError("No se pudieron detectar duplicados: " + err.message);
    else setDuplicados(data||[]);
  }, []);
  const fetchCodigos = useCallback(async () => {
    const { data, error: err } = await supabase.from("codigos_invitacion")
      .select("*, centro:centros_acopio(nombre)")
      .order("created_at",{ascending:false});
    if (err) setError("No se pudieron cargar los códigos de invitación: " + err.message);
    else setCodigos(data||[]);
  }, []);
  const fetchCiudades = useCallback(async () => {
    const { data, error: err } = await supabase.from("ciudades").select("*").eq("activa",true).order("nombre");
    if (err) setError("No se pudieron cargar las ciudades: " + err.message);
    else setCiudades(data||[]);
  }, []);
  const fetchAdmins = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("listar_admins_ciudad");
    if (err) setError("No se pudieron cargar los administradores de ciudad: " + err.message);
    else setAdmins(data||[]);
  }, []);

  useEffect(()=>{
    fetchCentros(); fetchCodigos(); fetchCiudades();
    if (esSuperAdmin) { fetchPendientesCatalogo(); fetchDuplicados(); fetchAdmins(); }
  },[fetchCentros, fetchCodigos, fetchCiudades, fetchPendientesCatalogo, fetchDuplicados, fetchAdmins, esSuperAdmin]);

  const cambiarEstado = async (id,estado) => {
    const { error: err } = await supabase.rpc("cambiar_estado_centro",{p_centro_id:id,p_estado:estado});
    if (err) { alert("No se pudo cambiar el estado del centro: " + err.message); return; }
    fetchCentros();
  };

  const moderarItem = async (clase, id, estado) => {
    const { error: err } = clase === "tipo"
      ? await supabase.rpc("moderar_tipo_producto", {p_id:id, p_estado:estado})
      : await supabase.rpc("moderar_categoria", {p_id:id, p_estado:estado});
    if (err) { alert("No se pudo moderar: " + err.message); return; }
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

  const generarCodigo = async () => {
    if (esSuperAdmin && !ciudadParaCodigo) { alert("Elige la ciudad para la que quieres generar el código."); return; }
    setGenerandoCodigo(true);
    const { data, error } = await supabase.rpc("generar_codigo_invitacion", { p_ciudad: esSuperAdmin ? ciudadParaCodigo : null }).single();
    if (error) alert("No se pudo generar el código: " + error.message);
    else setCodigoNuevo(data);
    setGenerandoCodigo(false);
    fetchCodigos();
  };

  const copiarCodigo = codigo => navigator.clipboard.writeText(codigo);

  const asignarAdmin = async () => {
    if (!nuevoAdminEmail.trim() || !nuevoAdminCiudad) { alert("Completa el correo y la ciudad."); return; }
    setAsignandoAdmin(true);
    const { error: err } = await supabase.rpc("asignar_admin_ciudad", { p_email: nuevoAdminEmail.trim(), p_ciudad: nuevoAdminCiudad });
    if (err) alert("No se pudo asignar: " + err.message);
    else { setNuevoAdminEmail(""); setNuevoAdminCiudad(""); fetchAdmins(); }
    setAsignandoAdmin(false);
  };

  const revocarAdmin = async (usuarioId, nombre) => {
    if (!confirm(`¿Quitar el rol de administrador de ciudad a "${nombre}"? Su cuenta regresará a un rol normal.`)) return;
    const { error: err } = await supabase.rpc("revocar_admin_ciudad", { p_usuario_id: usuarioId });
    if (err) alert("No se pudo revocar: " + err.message);
    else fetchAdmins();
  };

  if(!esSuperAdmin && !esAdminCiudad) return (
    <div className="content"><div className="empty-state"><div style={{fontSize:48}}>🔑</div><h3>Acceso restringido</h3><p>Solo un administrador puede ver esta sección.</p></div></div>
  );

  const pendientes=centros.filter(c=>c.estado==="pendiente");

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Administración</h2>
          <p>{esSuperAdmin ? "Super Admin · gestión global de centros y catálogo" : `Admin de ${miCiudad} · gestión de centros de tu ciudad`}</p>
        </div>
      </div>
      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}
      {esSuperAdmin && duplicados.length>0&&<div className="alert alert-error mb-4">⚠️ <strong>{duplicados.length}</strong> posible{duplicados.length>1?"s":""} centro{duplicados.length>1?"s":""} duplicado{duplicados.length>1?"s":""} detectado{duplicados.length>1?"s":""} por nombre similar.</div>}
      {pendientes.length>0&&<div className="alert alert-warning mb-4">⏳ <strong>{pendientes.length}</strong> centro{pendientes.length>1?"s":""} pendiente{pendientes.length>1?"s":""} de aprobación.</div>}
      {esSuperAdmin && pendientesCatalogo.length>0&&<div className="alert alert-warning mb-4">🏷️ <strong>{pendientesCatalogo.length}</strong> tipo{pendientesCatalogo.length>1?"s":""}/categoría{pendientesCatalogo.length>1?"s":""} de producto pendiente{pendientesCatalogo.length>1?"s":""} de revisión.</div>}

      {esSuperAdmin && (
        <div className="card mb-4">
          <div className="card-header"><h3>Administradores de Ciudad ({admins.length})</h3></div>
          <div className="card-pad" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end",borderBottom:"1px solid var(--slate-100)",paddingBottom:16}}>
            <div className="field" style={{flex:"1 1 220px",marginBottom:0}}>
              <label>Correo de la cuenta a promover</label>
              <input value={nuevoAdminEmail} onChange={e=>setNuevoAdminEmail(e.target.value)} placeholder="correo@ejemplo.com"/>
            </div>
            <div className="field" style={{flex:"0 0 200px",marginBottom:0}}>
              <label>Ciudad</label>
              <select value={nuevoAdminCiudad} onChange={e=>setNuevoAdminCiudad(e.target.value)}>
                <option value="">— Selecciona —</option>
                {ciudades.map(c=><option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={asignarAdmin} disabled={asignandoAdmin}>
              {asignandoAdmin?<><span className="spinner"/> Asignando...</>:"Asignar"}
            </button>
          </div>
          <div className="table-wrap">
            {admins.length===0 ? <div className="empty-state" style={{padding:30}}><p className="text-muted">Aún no hay administradores de ciudad asignados</p></div> : (
              <table>
                <thead><tr><th>Ciudad</th><th>Correo</th><th>Nombre</th><th>Centro propio</th><th></th></tr></thead>
                <tbody>
                  {admins.map(a=>(
                    <tr key={a.usuario_id}>
                      <td style={{fontWeight:600}}>{a.ciudad_asignada}</td>
                      <td style={{fontSize:12}}>{a.email}</td>
                      <td style={{fontSize:12}}>{a.nombre||"—"}</td>
                      <td style={{fontSize:12}}>{a.centro_nombre||"—"}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={()=>revocarAdmin(a.usuario_id, a.nombre||a.email)}>Revocar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header">
          <h3>Códigos de Invitación ({codigos.length})</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {esSuperAdmin && (
              <select value={ciudadParaCodigo} onChange={e=>setCiudadParaCodigo(e.target.value)} style={{fontSize:12,padding:"6px 8px"}}>
                <option value="">Ciudad del código...</option>
                {ciudades.map(c=><option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
              </select>
            )}
            <button className="btn btn-primary btn-sm" onClick={generarCodigo} disabled={generandoCodigo}>
              {generandoCodigo?<><span className="spinner"/> Generando...</>:"+ Generar código"}
            </button>
          </div>
        </div>
        {codigoNuevo && (
          <div className="alert alert-success" style={{margin:"14px 20px 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span>✓ Código: <strong style={{fontSize:16,letterSpacing:1}}>{codigoNuevo.codigo}</strong> · válido hasta {new Date(codigoNuevo.expira_en).toLocaleString("es-MX")}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>copiarCodigo(codigoNuevo.codigo)}>📋 Copiar</button>
            <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Tu código de invitación para registrar tu centro en AcopioVen es: ${codigoNuevo.codigo} (válido 72h). Regístralo en https://acopioven.vercel.app`)}`}>
              💬 WhatsApp
            </a>
            <a className="btn btn-ghost btn-sm"
              href={`mailto:?subject=${encodeURIComponent("Código de invitación AcopioVen")}&body=${encodeURIComponent(`Tu código de invitación para registrar tu centro en AcopioVen es: ${codigoNuevo.codigo} (válido 72h).\n\nRegístralo en https://acopioven.vercel.app`)}`}>
              ✉️ Correo
            </a>
          </div>
        )}
        <div className="table-wrap">
          {codigos.length===0 ? <div className="empty-state" style={{padding:30}}><p className="text-muted">Aún no se han generado códigos</p></div> : (
            <table>
              <thead><tr><th>Código</th><th>Ciudad</th><th>Generado</th><th>Expira</th><th>Estado</th><th>Usado por</th></tr></thead>
              <tbody>
                {codigos.map(c=>{
                  const usado = !!c.usado_en;
                  const expirado = !usado && new Date(c.expira_en) < new Date();
                  const [cls,label] = usado ? ["badge-slate","Usado"] : expirado ? ["badge-red","Expirado"] : ["badge-green","Activo"];
                  return (
                    <tr key={c.id}>
                      <td style={{fontWeight:600,letterSpacing:1}}>{c.codigo}</td>
                      <td style={{fontSize:12}}>{c.ciudad||"—"}</td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{new Date(c.created_at).toLocaleString("es-MX")}</td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{new Date(c.expira_en).toLocaleString("es-MX")}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td style={{fontSize:12}}>{c.centro?.nombre||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {esSuperAdmin && duplicados.length>0&&(
        <div className="card mb-4">
          <div className="card-header"><h3>⚠️ Posibles Centros Duplicados ({duplicados.length})</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Centro A</th><th>Centro B</th><th>Similitud</th><th>Acción</th></tr></thead>
              <tbody>
                {duplicados.map((d)=>(
                  <tr key={`${d.id_a}-${d.id_b}`}>
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
            &ldquo;Fusionar A → B&rdquo; mueve todas las donaciones y cajas de A hacia B, y suspende A. Revisa bien antes de confirmar.
          </div>
        </div>
      )}

      {esSuperAdmin && (
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
      )}

      <div className="card mb-4">
        <div className="card-header"><h3>Pendientes de Aprobación{esAdminCiudad?` en ${miCiudad}`:""} ({pendientes.length})</h3></div>
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
        <div className="card-header"><h3>{esAdminCiudad?`Centros de ${miCiudad}`:"Todos los Centros"} ({centros.length})</h3></div>
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
