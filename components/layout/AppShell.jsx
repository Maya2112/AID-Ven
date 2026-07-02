"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Ico from "@/components/ui/Ico";
import Dashboard from "@/components/dashboard/Dashboard";
import InventarioView from "@/components/inventario/InventarioView";
import CajasEmbalajeView from "@/components/cajas/CajasEmbalajeView";
import ResumenCentroView from "@/components/resumenes/ResumenCentroView";
import ResumenGlobalView from "@/components/resumenes/ResumenGlobalView";
import ManifiestoView from "@/components/manifiesto/ManifiestoView";
import AdminView from "@/components/admin/AdminView";
import ModalLogoCentro from "./ModalLogoCentro";

export default function AppShell({ usuario, centro, tipos, categorias, tiposParaCaptura, categoriasParaCaptura, catalogo, onCatalogoChange }) {
  const [vista, setVista] = useState("dashboard");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(false);
  const [showModalLogo, setShowModalLogo] = useState(false);
  const [logoOverride, setLogoOverride] = useState(undefined); // undefined = usar el de `centro` tal cual
  const isAdmin = usuario?.rol==="admin_global";
  const isAdminCiudad = usuario?.rol==="admin_ciudad";
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("No se pudo cerrar sesión: " + error.message);
  };

  // El centro que se pasa a las vistas hijas, reflejando el logo recién
  // subido/quitado sin esperar a un refetch completo desde AcopioVen.
  const centroEfectivo = centro && logoOverride !== undefined ? { ...centro, logo_url: logoOverride } : centro;

  // Deteccion robusta de movil via JS (no depende de que el media query CSS cargue a tiempo).
  // Aplicamos estilos INLINE segun esto, que siempre tienen prioridad sobre el CSS externo.
  useEffect(() => {
    const checkSize = () => setEsMovil(window.innerWidth <= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const nav = [
    {id:"dashboard",label:"Panel Principal",icon:"home"},
    {id:"inventario",label:"Inventario de Donativos",icon:"list"},
    {id:"cajas",label:"Lista de Cajas",icon:"package"},
    {id:"resumen-centro",label:"Resumen de mi Centro",icon:"chart"},
    {id:"resumen-global",label:"Resumen Global",icon:"globe"},
    {id:"manifiesto",label:"Manifiesto de Carga",icon:"truck"},
    ...((isAdmin||isAdminCiudad)?[{id:"admin",label:"Administración",icon:"admin"}]:[]),
  ];

  const irA = (id) => { setVista(id); setSidebarAbierto(false); };
  const tituloActual = nav.find(n=>n.id===vista)?.label || "AcopioVen";

  // Estilos inline calculados en JS: garantizan el comportamiento correcto
  // sin depender de que el media query CSS se aplique a tiempo o del todo.
  const appStyle = esMovil ? { flexDirection: "column" } : {};
  const sidebarStyle = esMovil
    ? { transform: sidebarAbierto ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease" }
    : {};
  const mainStyle = esMovil ? { marginLeft: 0, width: "100%" } : {};
  const topbarStyle = { display: esMovil ? "flex" : "none" };
  const overlayStyle = { display: (esMovil && sidebarAbierto) ? "block" : "none" };

  return (
    <div className="app" style={appStyle}>
      <div className="mobile-topbar" style={topbarStyle}>
        <button className="hamburger-btn" onClick={()=>setSidebarAbierto(true)} aria-label="Abrir menú">
          <span/><span/><span/>
        </button>
        <div className="mobile-topbar-title">🇻🇪 {tituloActual}</div>
      </div>

      <div className="sidebar-overlay" style={overlayStyle} onClick={()=>setSidebarAbierto(false)}/>

      <aside className={`sidebar ${sidebarAbierto?"open":""}`} style={sidebarStyle}>
        <div className="sidebar-logo" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <div className="sidebar-flag">🇻🇪</div>
            <h1>AcopioVen</h1>
            <p>Ayuda Humanitaria</p>
          </div>
          {esMovil && (
            <button onClick={()=>setSidebarAbierto(false)} aria-label="Cerrar menú"
              style={{background:"rgba(255,255,255,.1)",border:"none",color:"white",width:30,height:30,borderRadius:6,fontSize:16,cursor:"pointer",flexShrink:0}}>
              ✕
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Navegación</div>
          {nav.map(item=>(
            <button key={item.id} className={`nav-btn ${vista===item.id?"active":""}`} onClick={()=>irA(item.id)}>
              <Ico name={item.icon} size={14}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {centroEfectivo&&(
            <div className="centro-badge">
              <p>Centro de acopio</p>
              {centroEfectivo.id && (
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0"}}>
                  <div style={{
                    width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0,
                    background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center"
                  }}>
                    {centroEfectivo.logo_url
                      ? <img src={centroEfectivo.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <span style={{fontSize:14}}>🏢</span>}
                  </div>
                  <button onClick={()=>setShowModalLogo(true)}
                    style={{background:"none",border:"none",color:"rgba(255,255,255,.6)",fontSize:11,cursor:"pointer",textDecoration:"underline",padding:0}}>
                    {centroEfectivo.logo_url?"Cambiar logo":"Subir logo"}
                  </button>
                </div>
              )}
              <h3>{centroEfectivo.nombre}</h3>
              <div style={{marginTop:4,fontSize:11,color:"rgba(255,255,255,.5)"}}>
                <span className={`status-dot status-${centroEfectivo.estado}`}/>
                {centroEfectivo.estado==="aprobado"?"Aprobado":centroEfectivo.estado==="pendiente"?"Pendiente aprobación":"Suspendido"}
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={logout}>⇒ Cerrar sesión</button>
        </div>
      </aside>
      <main className="main" style={mainStyle}>
        {vista==="dashboard"&&<Dashboard centro={centroEfectivo} tipos={tipos} categorias={categorias} tiposParaCaptura={tiposParaCaptura} categoriasParaCaptura={categoriasParaCaptura} catalogo={catalogo} onCatalogoChange={onCatalogoChange} esAdmin={isAdmin}/>}
        {vista==="inventario"&&<InventarioView centro={centroEfectivo} tipos={tipos} categorias={categorias} tiposParaCaptura={tiposParaCaptura} categoriasParaCaptura={categoriasParaCaptura} catalogo={catalogo} onCatalogoChange={onCatalogoChange} esAdmin={isAdmin}/>}
        {vista==="cajas"&&<CajasEmbalajeView centro={centroEfectivo} tipos={tipos} categorias={categorias}/>}
        {vista==="resumen-centro"&&<ResumenCentroView centro={centroEfectivo} tipos={tipos}/>}
        {vista==="resumen-global"&&<ResumenGlobalView/>}
        {vista==="manifiesto"&&<ManifiestoView centro={centroEfectivo} esAdmin={isAdmin}/>}
        {vista==="admin"&&<AdminView usuario={usuario}/>}
      </main>
      {showModalLogo && centroEfectivo?.id && (
        <ModalLogoCentro
          centroId={centroEfectivo.id}
          logoUrl={centroEfectivo.logo_url}
          onClose={()=>setShowModalLogo(false)}
          onSaved={(nuevaUrl)=>{ setLogoOverride(nuevaUrl); setShowModalLogo(false); }}
        />
      )}
    </div>
  );
}

