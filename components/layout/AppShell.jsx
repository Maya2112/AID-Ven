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

export default function AppShell({ usuario, centro, tipos, categorias, tiposParaCaptura, categoriasParaCaptura, catalogo, onCatalogoChange }) {
  const [vista, setVista] = useState("dashboard");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(false);
  const isAdmin = usuario?.rol==="admin_global";
  const logout = () => supabase.auth.signOut();

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
    {id:"inventario",label:"Inventario",icon:"list"},
    {id:"cajas",label:"Cajas de Embalaje",icon:"package"},
    {id:"resumen-centro",label:"Resumen de mi Centro",icon:"chart"},
    {id:"resumen-global",label:"Resumen Global",icon:"globe"},
    {id:"manifiesto",label:"Manifiesto de Carga",icon:"truck"},
    ...(isAdmin?[{id:"admin",label:"Administración",icon:"admin"}]:[]),
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
          {centro&&(
            <div className="centro-badge">
              <p>Centro de acopio</p>
              <h3>{centro.nombre}</h3>
              <div style={{marginTop:4,fontSize:11,color:"rgba(255,255,255,.5)"}}>
                <span className={`status-dot status-${centro.estado}`}/>
                {centro.estado==="aprobado"?"Aprobado":centro.estado==="pendiente"?"Pendiente aprobación":"Suspendido"}
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={logout}>⇒ Cerrar sesión</button>
        </div>
      </aside>
      <main className="main" style={mainStyle}>
        {vista==="dashboard"&&<Dashboard centro={centro} tipos={tipos} categorias={categorias} tiposParaCaptura={tiposParaCaptura} categoriasParaCaptura={categoriasParaCaptura} catalogo={catalogo} onCatalogoChange={onCatalogoChange} esAdmin={isAdmin}/>}
        {vista==="inventario"&&<InventarioView centro={centro} tipos={tipos} categorias={categorias} tiposParaCaptura={tiposParaCaptura} categoriasParaCaptura={categoriasParaCaptura} catalogo={catalogo} onCatalogoChange={onCatalogoChange} esAdmin={isAdmin}/>}
        {vista==="cajas"&&<CajasEmbalajeView centro={centro} tipos={tipos} categorias={categorias}/>}
        {vista==="resumen-centro"&&<ResumenCentroView centro={centro} tipos={tipos}/>}
        {vista==="resumen-global"&&<ResumenGlobalView/>}
        {vista==="manifiesto"&&<ManifiestoView centro={centro} esAdmin={isAdmin}/>}
        {vista==="admin"&&<AdminView usuario={usuario}/>}
      </main>
    </div>
  );
}

