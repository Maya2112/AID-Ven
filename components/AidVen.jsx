"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ───────────────────────────────────────────────────────────
const SUPA_URL = "https://uxivvdvnkegoexzkjrka.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aXZ2ZHZua2Vnb2V4emtqcmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjU2MTYsImV4cCI6MjA5ODM0MTYxNn0.jUKc8_txVaax6UCuguzPvlryIqHuEpB6Rgo3QNxBTIs";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy: #0f1f3d; --navy-800: #1a3360; --navy-700: #254885;
    --blue: #2563eb; --blue-light: #dbeafe;
    --green: #059669; --green-light: #d1fae5;
    --amber: #d97706; --amber-light: #fef3c7;
    --red: #dc2626; --red-light: #fee2e2;
    --slate-50: #f8fafc; --slate-100: #f1f5f9; --slate-200: #e2e8f0;
    --slate-400: #94a3b8; --slate-500: #64748b; --slate-700: #334155; --slate-900: #0f172a;
    --white: #ffffff; --radius: 10px; --radius-sm: 6px;
    --shadow: 0 1px 3px rgba(0,0,0,.08); --shadow-md: 0 4px 12px rgba(0,0,0,.10); --shadow-lg: 0 10px 30px rgba(0,0,0,.12);
    --font-ui: 'Inter', system-ui, sans-serif; --font-display: 'Space Grotesk', system-ui, sans-serif;
  }
  body { font-family: var(--font-ui); background: var(--slate-50); color: var(--slate-900); min-height: 100vh; }
  .app { display: flex; min-height: 100vh; }
  .sidebar { width: 240px; background: var(--navy); color: white; display: flex; flex-direction: column; flex-shrink: 0; position: fixed; top: 0; left: 0; height: 100vh; z-index: 50; }
  .sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,.08); }
  .sidebar-logo h1 { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: white; letter-spacing: -.3px; }
  .sidebar-logo p { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; text-transform: uppercase; letter-spacing: .8px; }
  .sidebar-flag { font-size: 22px; margin-bottom: 4px; }
  .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .nav-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.3); text-transform: uppercase; letter-spacing: 1px; padding: 12px 8px 4px; }
  .nav-btn { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm); cursor: pointer; background: none; border: none; color: rgba(255,255,255,.65); font-size: 13.5px; font-family: var(--font-ui); transition: all .15s; text-align: left; width: 100%; }
  .nav-btn:hover { background: rgba(255,255,255,.07); color: white; }
  .nav-btn.active { background: rgba(255,255,255,.12); color: white; font-weight: 500; }
  .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,.08); }
  .centro-badge { background: rgba(255,255,255,.06); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 10px; }
  .centro-badge p { font-size: 11px; color: rgba(255,255,255,.4); margin-bottom: 2px; }
  .centro-badge h3 { font-size: 13px; color: rgba(255,255,255,.85); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; }
  .status-aprobado { background: var(--green); }
  .status-pendiente { background: var(--amber); }
  .status-suspendido { background: var(--red); }
  .btn-logout { width: 100%; text-align: left; background: none; border: none; color: rgba(255,255,255,.45); font-size: 12.5px; cursor: pointer; padding: 6px 4px; display: flex; align-items: center; gap: 8px; font-family: var(--font-ui); }
  .btn-logout:hover { color: rgba(255,255,255,.75); }
  .main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; min-height: 100vh; }
  .content { flex: 1; padding: 28px; }
  .card { background: white; border-radius: var(--radius); border: 1px solid var(--slate-200); box-shadow: var(--shadow); }
  .card-pad { padding: 20px 24px; }
  .card-header { padding: 16px 20px; border-bottom: 1px solid var(--slate-100); display: flex; align-items: center; justify-content: space-between; }
  .card-header h3 { font-size: 14px; font-weight: 600; color: var(--slate-700); }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: white; border: 1px solid var(--slate-200); border-radius: var(--radius); padding: 18px 20px; box-shadow: var(--shadow); }
  .stat-card.accent-blue { border-top: 3px solid var(--blue); }
  .stat-card.accent-green { border-top: 3px solid var(--green); }
  .stat-card.accent-amber { border-top: 3px solid var(--amber); }
  .stat-card.accent-navy { border-top: 3px solid var(--navy); }
  .stat-label { font-size: 11.5px; font-weight: 500; color: var(--slate-500); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .stat-value { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--slate-900); line-height: 1; }
  .stat-sub { font-size: 11.5px; color: var(--slate-500); margin-top: 4px; }
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 500; cursor: pointer; border: none; font-family: var(--font-ui); transition: all .15s; }
  .btn-primary { background: var(--blue); color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: white; color: var(--slate-700); border: 1px solid var(--slate-200); }
  .btn-secondary:hover { background: var(--slate-50); }
  .btn-danger { background: var(--red); color: white; }
  .btn-danger:hover { background: #b91c1c; }
  .btn-ghost { background: none; color: var(--slate-500); border: 1px solid transparent; }
  .btn-ghost:hover { background: var(--slate-100); color: var(--slate-700); }
  .btn-success { background: var(--green); color: white; }
  .btn-success:hover { background: #047857; }
  .btn-sm { padding: 6px 12px; font-size: 12.5px; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .form-full { grid-column: 1 / -1; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label { font-size: 12.5px; font-weight: 500; color: var(--slate-700); }
  .field label span.req { color: var(--red); margin-left: 2px; }
  .field input, .field select, .field textarea { padding: 9px 12px; border: 1px solid var(--slate-200); border-radius: var(--radius-sm); font-size: 13.5px; font-family: var(--font-ui); color: var(--slate-900); background: white; outline: none; transition: border-color .15s; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
  .field textarea { resize: vertical; min-height: 72px; }
  .field .hint { font-size: 11.5px; color: var(--slate-500); }
  .tooltip-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: var(--blue-light); color: var(--blue); font-size: 10px; font-weight: 700; cursor: pointer; position: relative; flex-shrink: 0; }
  .tooltip-box { display: none; position: absolute; left: 22px; top: -4px; background: var(--slate-900); color: white; font-size: 11.5px; line-height: 1.5; padding: 8px 12px; border-radius: var(--radius-sm); width: 260px; z-index: 100; box-shadow: var(--shadow-lg); }
  .tooltip-icon:hover .tooltip-box { display: block; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { padding: 10px 14px; text-align: left; font-size: 11.5px; font-weight: 600; color: var(--slate-500); text-transform: uppercase; letter-spacing: .4px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); white-space: nowrap; }
  td { padding: 11px 14px; border-bottom: 1px solid var(--slate-100); color: var(--slate-700); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--slate-50); }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
  .badge-blue { background: var(--blue-light); color: #1e40af; }
  .badge-green { background: var(--green-light); color: #065f46; }
  .badge-amber { background: var(--amber-light); color: #92400e; }
  .badge-red { background: var(--red-light); color: #991b1b; }
  .badge-slate { background: var(--slate-100); color: var(--slate-700); }
  .badge-navy { background: #dde6f5; color: var(--navy-700); }
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--navy); padding: 20px; }
  .auth-card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); }
  .auth-logo { text-align: center; margin-bottom: 28px; }
  .auth-logo h1 { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--navy); }
  .auth-logo p { color: var(--slate-500); font-size: 13.5px; margin-top: 4px; }
  .auth-logo .flag { font-size: 32px; display: block; margin-bottom: 10px; }
  .auth-tabs { display: flex; background: var(--slate-100); border-radius: var(--radius-sm); padding: 3px; margin-bottom: 24px; }
  .auth-tab { flex: 1; padding: 8px; border-radius: 5px; border: none; background: none; font-family: var(--font-ui); font-size: 13.5px; font-weight: 500; cursor: pointer; color: var(--slate-500); transition: all .15s; }
  .auth-tab.active { background: white; color: var(--slate-900); box-shadow: var(--shadow); }
  .alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13.5px; margin-bottom: 16px; }
  .alert-error { background: var(--red-light); color: #7f1d1d; border: 1px solid #fca5a5; }
  .alert-success { background: var(--green-light); color: #064e3b; border: 1px solid #6ee7b7; }
  .alert-warning { background: var(--amber-light); color: #78350f; border: 1px solid #fcd34d; }
  .alert-info { background: var(--blue-light); color: #1e3a8a; border: 1px solid #93c5fd; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .modal { background: white; border-radius: 14px; box-shadow: var(--shadow-lg); width: 100%; max-width: 660px; max-height: 90vh; overflow-y: auto; }
  .modal-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--slate-100); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: white; z-index: 10; }
  .modal-header h2 { font-family: var(--font-display); font-size: 17px; font-weight: 600; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--slate-100); display: flex; justify-content: flex-end; gap: 10px; position: sticky; bottom: 0; background: white; }
  .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--slate-400); padding: 4px; line-height: 1; }
  .type-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .type-tab { padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--slate-200); background: white; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--slate-600); font-family: var(--font-ui); transition: all .15s; display: flex; align-items: center; gap: 6px; }
  .type-tab:hover { border-color: var(--blue); color: var(--blue); }
  .type-tab.active { background: var(--blue); border-color: var(--blue); color: white; }
  .page-header { margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .page-header-text h2 { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--slate-900); }
  .page-header-text p { font-size: 13.5px; color: var(--slate-500); margin-top: 4px; }
  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--slate-700); margin-bottom: 6px; margin-top: 12px; }
  .empty-state p { font-size: 13.5px; color: var(--slate-500); max-width: 320px; margin: 0 auto 20px; }
  .tipo-section { margin-bottom: 12px; }
  .tipo-header { background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background .15s; }
  .tipo-header:hover { background: var(--slate-100); }
  .tipo-header h3 { font-size: 14px; font-weight: 600; color: var(--slate-800); display: flex; align-items: center; gap: 8px; }
  .tipo-meta { display: flex; gap: 16px; align-items: center; font-size: 12.5px; color: var(--slate-500); }
  .tipo-body { border: 1px solid var(--slate-200); border-top: none; border-radius: 0 0 var(--radius) var(--radius); overflow: hidden; }
  .pending-banner { background: var(--amber-light); border-bottom: 2px solid #fcd34d; padding: 12px 28px; font-size: 13px; color: #78350f; }
  .section-label { font-size: 11px; font-weight: 600; color: var(--slate-500); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--slate-100); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; } .mb-4 { margin-bottom: 16px; } .mb-6 { margin-bottom: 24px; }
  .mt-2 { margin-top: 8px; } .mt-4 { margin-top: 16px; }
  .flex { display: flex; } .items-center { align-items: center; } .gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
  .text-sm { font-size: 12.5px; } .text-muted { color: var(--slate-500); } .font-600 { font-weight: 600; }
  /* Topbar movil con boton hamburguesa */
  .mobile-topbar { display: none; }
  .hamburger-btn { background: none; border: none; cursor: pointer; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
  .hamburger-btn span { display: block; width: 22px; height: 2px; background: var(--slate-700); border-radius: 1px; }
  .sidebar-overlay { display: none; }

  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); transition: transform .25s ease; }
    .sidebar.open { transform: translateX(0); }
    .main { margin-left: 0; }
    .form-grid, .form-grid-3, .grid-2 { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .content { padding: 16px; }
    .mobile-topbar {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; background: var(--navy); color: white;
      position: sticky; top: 0; z-index: 40;
    }
    .mobile-topbar .hamburger-btn span { background: white; }
    .mobile-topbar-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .sidebar-overlay.open {
      display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 49;
    }
  }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const ICONOS = {
  pill:"💊", baby:"👶", stethoscope:"🩺", sparkles:"✨", utensils:"🍽️",
  shield:"🛡️", "spray-can":"🧴", package:"📦", home:"🏠", list:"📋",
  plus:"＋", globe:"🌍", chart:"📊", truck:"🚛", admin:"🔑", logout:"⇒",
};
const Ico = ({ name, size=14 }) => <span style={{fontSize:size}}>{ICONOS[name]||"•"}</span>;

const EstadoBadge = ({ estado }) => {
  const m = {
    recibido:["badge-slate","Recibido"], clasificado:["badge-blue","Clasificado"],
    empacado:["badge-amber","Empacado"], listo_para_envio:["badge-green","Listo para envío"],
    enviado:["badge-navy","Enviado"], pendiente:["badge-amber","Pendiente"],
    aprobado:["badge-green","Aprobado"], suspendido:["badge-red","Suspendido"],
  };
  const [cls, label] = m[estado] || ["badge-slate", estado];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const Tooltip = ({ text }) => (
  <span className="tooltip-icon">?<span className="tooltip-box">{text}</span></span>
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthView() {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email:"", password:"", nombre:"",
    centro_nombre:"", ciudad:"", pais:"México",
    contacto_nombre:"", contacto_email:"", contacto_telefono:""
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (step===1) { setStep(2); return; }
    setError(""); setLoading(true);
    try {
      const { data, error:err } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { nombre: form.nombre } }
      });
      if (err) throw err;
      if (!data?.user?.id) throw new Error("No se pudo crear la cuenta.");
      const { error:centroErr } = await supabase.rpc("registrar_centro", {
        p_nombre: form.centro_nombre, p_ciudad: form.ciudad, p_pais: form.pais,
        p_contacto_nombre: form.contacto_nombre || form.nombre,
        p_contacto_email: form.contacto_email || form.email,
        p_contacto_telefono: form.contacto_telefono,
      });
      if (centroErr) throw centroErr;
      setSuccess("¡Cuenta creada! Tu centro quedó pendiente de aprobación. Una vez aprobado tendrás acceso completo.");
    } catch(err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="flag">🇻🇪</span>
          <h1>AcopioVen</h1>
          <p>Control de donaciones · Ayuda Humanitaria</p>
        </div>

        {success ? (
          <>
            <div className="alert alert-success">✓ {success}</div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}}
              onClick={()=>{setSuccess("");setTab("login");setStep(1);}}>
              Ir a Iniciar Sesión
            </button>
          </>
        ) : (
          <>
            <div className="auth-tabs">
              <button className={`auth-tab ${tab==="login"?"active":""}`}
                onClick={()=>{setTab("login");setStep(1);setError("");}}>Iniciar Sesión</button>
              <button className={`auth-tab ${tab==="register"?"active":""}`}
                onClick={()=>{setTab("register");setStep(1);setError("");}}>Nuevo Centro</button>
            </div>
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <form onSubmit={tab==="login"?handleLogin:handleRegister}>
              {tab==="login" ? (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="field"><label>Correo</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required autoFocus /></div>
                  <div className="field"><label>Contraseña</label><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} required /></div>
                  <button className="btn btn-primary" type="submit" disabled={loading}
                    style={{width:"100%",justifyContent:"center",marginTop:4}}>
                    {loading?<><span className="spinner"/> Entrando...</>:"Iniciar sesión"}
                  </button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {step===1 && <>
                    <div className="alert alert-info">Paso 1 de 2 — Datos de tu cuenta</div>
                    <div className="field"><label>Nombre completo<span className="req">*</span></label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} required /></div>
                    <div className="field"><label>Correo<span className="req">*</span></label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required /></div>
                    <div className="field"><label>Contraseña<span className="req">*</span></label><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} required minLength={6}/><span className="hint">Mínimo 6 caracteres</span></div>
                  </>}
                  {step===2 && <>
                    <div className="alert alert-info">Paso 2 de 2 — Datos de tu Centro de Acopio</div>
                    <div className="field"><label>Nombre del centro<span className="req">*</span></label><input value={form.centro_nombre} onChange={e=>set("centro_nombre",e.target.value)} required placeholder="Ej: Centro de Acopio Norte Cancún"/></div>
                    <div className="grid-2">
                      <div className="field"><label>Ciudad<span className="req">*</span></label><input value={form.ciudad} onChange={e=>set("ciudad",e.target.value)} required placeholder="Cancún"/></div>
                      <div className="field"><label>País<span className="req" style={{visibility:"hidden"}}>*</span></label><input value={form.pais} onChange={e=>set("pais",e.target.value)}/></div>
                    </div>
                    <div className="field"><label>Teléfono de contacto</label><input value={form.contacto_telefono} onChange={e=>set("contacto_telefono",e.target.value)} placeholder="+52 998 000 0000"/></div>
                    <div className="alert alert-warning">⏳ Tu centro quedará <strong>pendiente</strong> hasta que el administrador lo apruebe.</div>
                  </>}
                  <div style={{display:"flex",gap:10}}>
                    {step===2 && <button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}>← Atrás</button>}
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{flex:1,justifyContent:"center"}}>
                      {loading?<><span className="spinner"/> Procesando...</>:step===1?"Continuar →":"Registrar Centro"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MODAL: NUEVO TIPO DE PRODUCTO ────────────────────────────────────────────
function ModalNuevoTipo({ onClose, onCreated }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.from("tipos_producto").insert({
      nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      icono: "package", es_predeterminado: false,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onCreated();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-header">
          <h2>Nuevo Tipo de Producto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            Este tipo quedará disponible para todos los centros de acopio.
          </div>
          <div className="field mb-3">
            <label>Nombre <span className="req">*</span></label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Material Escolar" autoFocus/>
          </div>
          <div className="field">
            <label>Descripción (opcional)</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={2}
              placeholder="Breve descripción de qué incluye este tipo"/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Creando...</>:"Crear Tipo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: NUEVA CATEGORÍA ────────────────────────────────────────────────────
function ModalNuevaCategoria({ onClose, onCreated, tipoId, tipoNombre }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tieneTalla, setTieneTalla] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.from("categorias").insert({
      tipo_id: tipoId, nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      tiene_campo_talla: tieneTalla, es_predeterminada: false,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    onCreated();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-header">
          <h2>Nueva Categoría</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            Esta categoría se agregará dentro de <strong>{tipoNombre}</strong> y quedará disponible para todos los centros.
          </div>
          <div className="field mb-3">
            <label>Nombre <span className="req">*</span></label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Cuadernos y Libretas" autoFocus/>
          </div>
          <div className="field mb-3">
            <label>Leyenda / guía (opcional)</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={2}
              placeholder="Ej: Cuadernos, libretas, lápices, colores..."/>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={tieneTalla} onChange={e=>setTieneTalla(e.target.checked)}/>
            Esta categoría necesita campo de talla/tamaño (ej. pañales, bolsas)
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Creando...</>:"Crear Categoría"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL DONACIÓN ───────────────────────────────────────────────────────────
function ModalDonacion({ onClose, onSaved, tipos, categorias, catalogo, centroId, onCatalogoChange }) {
  const [form, setForm] = useState({
    tipo_id:"", categoria_id:"", catalogo_id:"", nombre_producto:"", presentacion_mg:"",
    unidad:"unidad", cantidad_total:"", unidades_nivel2:"", unidades_nivel3:"",
    tipo_frasco:"", volumen_ml_frasco:"",
    talla:"", peso_unitario_kg:"",
    estado:"recibido", fecha_ingreso:new Date().toISOString().split("T")[0], observaciones:""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNuevoTipo, setShowNuevoTipo] = useState(false);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [pesoEditadoManual, setPesoEditadoManual] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const tipoSel = tipos.find(t=>t.id===form.tipo_id);
  const esMed = tipoSel?.nombre?.toLowerCase().includes("medicamento");
  const catsFiltradas = categorias.filter(c=>c.tipo_id===form.tipo_id);
  const catSel = categorias.find(c=>c.id===form.categoria_id);
  const productosFiltrados = catalogo.filter(p=>p.categoria_id===form.categoria_id);

  const totalMin = () => {
    const c=parseInt(form.cantidad_total)||0;
    const n2=parseInt(form.unidades_nivel2)||1;
    const n3=parseInt(form.unidades_nivel3)||1;
    return c*n2*n3;
  };

  const unidades = esMed
    ? ["caja","blister","frasco","ampolla","vial","sobre","unidad"]
    : ["unidad","caja","paquete","bolsa","litro","kg","rollo","par","juego","pieza"];

  // Al elegir un producto del catalogo, autocompletar peso/volumen/unidad/presentacion
  const handleSeleccionarProducto = (nombreEscrito) => {
    set("nombre_producto", nombreEscrito);
    const match = productosFiltrados.find(p => p.nombre.toLowerCase() === nombreEscrito.toLowerCase());
    if (match) {
      setForm(f => ({
        ...f,
        nombre_producto: match.nombre,
        catalogo_id: match.id,
        presentacion_mg: match.presentacion_mg || f.presentacion_mg,
        unidad: match.unidad_base || f.unidad,
        unidades_nivel2: match.unidades_nivel2 ? String(match.unidades_nivel2) : f.unidades_nivel2,
        unidades_nivel3: match.unidades_nivel3 ? String(match.unidades_nivel3) : f.unidades_nivel3,
        tipo_frasco: match.tipo_frasco || f.tipo_frasco,
        volumen_ml_frasco: match.volumen_ml_frasco ? String(match.volumen_ml_frasco) : f.volumen_ml_frasco,
        peso_unitario_kg: match.peso_unitario_kg ? String(match.peso_unitario_kg) : f.peso_unitario_kg,
      }));
      setPesoEditadoManual(false);
    } else {
      // Producto nuevo, no en catalogo: limpiar catalogo_id pero dejar peso editable
      set("catalogo_id", "");
    }
  };

  const handleSave = async () => {
    if (!centroId) {
      setError("Tu cuenta no tiene un centro de acopio asignado. Contacta al administrador para que te asigne uno antes de registrar donaciones.");
      return;
    }
    if (!form.tipo_id||!form.categoria_id||!form.nombre_producto||!form.cantidad_total) {
      setError("Completa: Tipo, Categoría, Nombre del producto y Cantidad."); return;
    }
    setError(""); setLoading(true);

    const esFrasco = form.unidad === "frasco";

    // Si el producto no existe en el catalogo, lo guardamos para futuras donaciones (peso autocompletado la proxima vez)
    let catalogoId = form.catalogo_id || null;
    if (!catalogoId) {
      const { data: nuevoProd } = await supabase.from("catalogo_productos").insert({
        tipo_id: form.tipo_id,
        categoria_id: form.categoria_id,
        nombre: form.nombre_producto,
        es_medicamento: esMed,
        presentacion_mg: esMed ? (form.presentacion_mg||null) : null,
        unidad_base: form.unidad,
        unidades_nivel2: form.unidades_nivel2 ? parseInt(form.unidades_nivel2) : null,
        unidades_nivel3: form.unidades_nivel3 ? parseInt(form.unidades_nivel3) : null,
        tipo_frasco: esFrasco ? (form.tipo_frasco||null) : null,
        volumen_ml_frasco: esFrasco && form.tipo_frasco==="liquido" ? (parseFloat(form.volumen_ml_frasco)||null) : null,
        peso_unitario_kg: form.peso_unitario_kg ? parseFloat(form.peso_unitario_kg) : 0,
        es_predeterminado: false,
      }).select("id").single();
      if (nuevoProd) catalogoId = nuevoProd.id;
    }

    const { error:err } = await supabase.from("donaciones").insert({
      centro_id: centroId,
      tipo_id: form.tipo_id,
      categoria_id: form.categoria_id,
      catalogo_id: catalogoId,
      nombre_producto: form.nombre_producto,
      presentacion_mg: esMed ? (form.presentacion_mg||null) : null,
      unidad: form.unidad,
      cantidad_total: parseInt(form.cantidad_total),
      unidades_nivel2: form.unidades_nivel2 ? parseInt(form.unidades_nivel2) : null,
      unidades_nivel3: esFrasco && form.tipo_frasco==="solido" ? parseInt(form.unidades_nivel3)||null : (form.unidades_nivel3 ? parseInt(form.unidades_nivel3) : null),
      tipo_frasco: esFrasco ? (form.tipo_frasco||null) : null,
      volumen_ml_frasco: esFrasco && form.tipo_frasco==="liquido" ? (parseFloat(form.volumen_ml_frasco)||null) : null,
      talla: form.talla||null,
      peso_unitario_kg: form.peso_unitario_kg ? parseFloat(form.peso_unitario_kg) : 0,
      estado: form.estado,
      fecha_ingreso: form.fecha_ingreso,
      observaciones: form.observaciones||null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    if (onCatalogoChange) onCatalogoChange();
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Registrar Donación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}

          <div className="flex justify-between items-center mb-2">
            <div className="section-label" style={{marginBottom:0}}>Tipo de producto</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNuevoTipo(true)}>
              ＋ Nuevo tipo
            </button>
          </div>
          <div className="type-tabs mb-4">
            {tipos.map(t=>(
              <button key={t.id} className={`type-tab ${form.tipo_id===t.id?"active":""}`}
                onClick={()=>{set("tipo_id",t.id);set("categoria_id","");set("catalogo_id","");}}>
                <Ico name={t.icono} size={13}/> {t.nombre}
              </button>
            ))}
          </div>

          {form.tipo_id && (
            <div className="form-grid mb-4">
              <div className="field">
                <div className="flex justify-between items-center">
                  <label>Categoría <span className="req">*</span></label>
                  <button type="button" onClick={()=>setShowNuevaCategoria(true)}
                    style={{background:"none",border:"none",color:"var(--blue)",fontSize:11.5,cursor:"pointer",fontFamily:"var(--font-ui)"}}>
                    ＋ Nueva categoría
                  </button>
                </div>
                <select value={form.categoria_id} onChange={e=>{set("categoria_id",e.target.value);set("catalogo_id","");}}>
                  <option value="">— Selecciona —</option>
                  {catsFiltradas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {catSel?.descripcion && (
                  <span style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                    <Tooltip text={catSel.descripcion}/>
                    <span style={{fontSize:11,color:"var(--blue)"}}>Ver qué incluye esta categoría</span>
                  </span>
                )}
              </div>
              <div className="field">
                <label>Fecha de ingreso</label>
                <input type="date" value={form.fecha_ingreso} onChange={e=>set("fecha_ingreso",e.target.value)}/>
              </div>
            </div>
          )}

          {form.categoria_id && <>
            <div className="section-label">Producto</div>
            <div className="form-grid mb-2">
              <div className="field form-full">
                <label>Nombre del producto <span className="req">*</span></label>
                <input
                  list={`productos-${form.categoria_id}`}
                  value={form.nombre_producto}
                  onChange={e=>handleSeleccionarProducto(e.target.value)}
                  placeholder={esMed?"Escribe o elige: Paracetamol, Ibuprofeno...":"Escribe o elige de la lista..."}
                />
                <datalist id={`productos-${form.categoria_id}`}>
                  {productosFiltrados.map(p=>(<option key={p.id} value={p.nombre}/>))}
                </datalist>
                <span className="hint">
                  {form.catalogo_id
                    ? "✓ Producto del catálogo — peso cargado automáticamente (puedes editarlo)"
                    : "Producto nuevo — el peso es opcional (se guardará para la próxima vez)"}
                </span>
              </div>
              {esMed && (
                <div className="field">
                  <label>Presentación / Concentración</label>
                  <input value={form.presentacion_mg} onChange={e=>set("presentacion_mg",e.target.value)}
                    placeholder="Ej: 500mg, 250ml, 10mg/5ml"/>
                </div>
              )}
              <div className="field">
                <label>Unidad de conteo</label>
                <select value={form.unidad} onChange={e=>set("unidad",e.target.value)}>
                  {unidades.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              {catSel?.tiene_campo_talla && (
                <div className="field">
                  <label>Talla / Tamaño</label>
                  <input value={form.talla} onChange={e=>set("talla",e.target.value)}
                    placeholder="Ej: RN, T1, T2, Grande, 10L..."/>
                </div>
              )}
            </div>

            <div className="section-label" style={{marginTop:16}}>Cantidad</div>
            <div className="form-grid mb-3">
              <div className="field">
                <label>Cantidad ({form.unidad}s) <span className="req">*</span></label>
                <input type="number" min="1" value={form.cantidad_total} onChange={e=>set("cantidad_total",e.target.value)} placeholder="Ej: 50"/>
              </div>
              {esMed && form.unidad==="caja" && (
                <div className="field">
                  <label>Blisters por caja</label>
                  <input type="number" min="1" value={form.unidades_nivel2} onChange={e=>set("unidades_nivel2",e.target.value)} placeholder="Ej: 3"/>
                </div>
              )}
              {esMed && (form.unidad==="caja"||form.unidad==="blister") && (
                <div className="field">
                  <label>Pastillas / cápsulas por blister</label>
                  <input type="number" min="1" value={form.unidades_nivel3} onChange={e=>set("unidades_nivel3",e.target.value)} placeholder="Ej: 10"/>
                </div>
              )}
              {esMed && form.unidad==="frasco" && (
                <div className="field">
                  <label>Contenido del frasco <span className="req">*</span></label>
                  <select value={form.tipo_frasco} onChange={e=>set("tipo_frasco",e.target.value)}>
                    <option value="">— Selecciona —</option>
                    <option value="solido">Sólido (pastillas/cápsulas)</option>
                    <option value="liquido">Líquido (jarabe, solución)</option>
                  </select>
                </div>
              )}
              {esMed && form.unidad==="frasco" && form.tipo_frasco==="solido" && (
                <div className="field">
                  <label>Pastillas / cápsulas por frasco</label>
                  <input type="number" min="1" value={form.unidades_nivel3} onChange={e=>set("unidades_nivel3",e.target.value)} placeholder="Ej: 100"/>
                </div>
              )}
              {esMed && form.unidad==="frasco" && form.tipo_frasco==="liquido" && (
                <div className="field">
                  <label>Volumen por frasco (ml)</label>
                  <input type="number" min="1" value={form.volumen_ml_frasco} onChange={e=>set("volumen_ml_frasco",e.target.value)} placeholder="Ej: 120"/>
                  <span className="hint">Solo informativo de la presentación (ej. jarabe 120ml)</span>
                </div>
              )}
            </div>
            {esMed && form.cantidad_total && (form.unidad!=="frasco" || form.tipo_frasco==="solido") && (
              <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
                📊 Total de pastillas/cápsulas: <strong>{totalMin().toLocaleString()}</strong>
              </div>
            )}

            <div className="section-label">Peso (opcional) {form.catalogo_id && form.peso_unitario_kg && <span style={{color:"var(--green)",fontWeight:400}}>· autocompletado</span>}</div>
            <div className="form-grid mb-4">
              <div className="field">
                <label>Peso por {form.unidad} (kg)</label>
                <input type="number" step="0.001" min="0" value={form.peso_unitario_kg}
                  onChange={e=>{set("peso_unitario_kg",e.target.value);setPesoEditadoManual(true);}} placeholder="0.050 (opcional)"/>
                {form.peso_unitario_kg&&form.cantidad_total&&(
                  <span className="hint">Total: {(parseFloat(form.peso_unitario_kg)*parseInt(form.cantidad_total||0)).toFixed(2)} kg</span>
                )}
              </div>
            </div>

            <div className="section-label">Estado y Observaciones</div>
            <div className="form-grid">
              <div className="field">
                <label>Estado inicial</label>
                <select value={form.estado} onChange={e=>set("estado",e.target.value)}>
                  <option value="recibido">Recibido</option>
                  <option value="clasificado">Clasificado</option>
                  <option value="empacado">Empacado</option>
                  <option value="listo_para_envio">Listo para envío</option>
                  <option value="enviado">Enviado</option>
                </select>
              </div>
              <div className="field form-full">
                <label>Observaciones</label>
                <textarea value={form.observaciones} onChange={e=>set("observaciones",e.target.value)}
                  placeholder="Lote, vencimiento, condición del producto, donante, notas..." rows={2}/>
              </div>
            </div>
          </>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Guardando...</>:"Guardar Donación"}
          </button>
        </div>
      </div>

      {showNuevoTipo && (
        <ModalNuevoTipo
          onClose={()=>setShowNuevoTipo(false)}
          onCreated={async ()=>{ setShowNuevoTipo(false); if(onCatalogoChange) await onCatalogoChange(); }}
        />
      )}
      {showNuevaCategoria && form.tipo_id && (
        <ModalNuevaCategoria
          onClose={()=>setShowNuevaCategoria(false)}
          tipoId={form.tipo_id}
          tipoNombre={tipoSel?.nombre || ""}
          onCreated={async ()=>{ setShowNuevaCategoria(false); if(onCatalogoChange) await onCatalogoChange(); }}
        />
      )}
    </div>
  );
}

// ─── VISTAS ───────────────────────────────────────────────────────────────────
function Dashboard({ centro, tipos, categorias, catalogo, onCatalogoChange }) {
  const [donaciones, setDonaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("donaciones")
      .select("*").eq("centro_id",centro.id).order("created_at",{ascending:false}).limit(10);
    setDonaciones(data||[]);
    setLoading(false);
  },[centro.id]);

  useEffect(()=>{ fetch(); },[fetch]);

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
                <p>Usa "Nueva Donación" para empezar a registrar los insumos que llegan.</p>
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
      {showModal&&<ModalDonacion onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);fetch();}} tipos={tipos} categorias={categorias} catalogo={catalogo} centroId={centro.id} onCatalogoChange={onCatalogoChange}/>}
    </div>
  );
}

function InventarioView({ centro, tipos, categorias, catalogo, onCatalogoChange }) {
  const [donaciones, setDonaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("donaciones")
      .select("*").eq("centro_id",centro.id).order("fecha_ingreso",{ascending:false});
    setDonaciones(data||[]);
    setLoading(false);
  },[centro.id]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const getNombre = (id,arr) => arr.find(a=>a.id===id)?.nombre||"—";
  const filtradas = donaciones.filter(d=>{
    if(filtroTipo!=="all"&&d.tipo_id!==filtroTipo) return false;
    if(filtroEstado!=="all"&&d.estado!==filtroEstado) return false;
    if(busqueda&&!d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const cambiarEstado = async (id,estado) => {
    await supabase.from("donaciones").update({estado}).eq("id",id);
    setDonaciones(prev=>prev.map(d=>d.id===id?{...d,estado}:d));
  };
  const eliminar = async id => {
    if(!confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    await supabase.from("donaciones").delete().eq("id",id);
    setDonaciones(prev=>prev.filter(d=>d.id!==id));
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Inventario completo</h2>
          <p>{donaciones.length} registros en {centro.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)} disabled={centro.estado!=="aprobado"}>＋ Nueva Donación</button>
      </div>
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
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtradas.length===0 ? <div className="empty-state"><h3>Sin resultados</h3><p>Ajusta los filtros para ver registros.</p></div>
          : (
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Producto</th><th>Conc.</th><th>Unidad/Talla</th><th>Cant.</th><th>Uds.Mín.</th><th>Peso(kg)</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {filtradas.map(d=>(
                  <tr key={d.id}>
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
      {showModal&&<ModalDonacion onClose={()=>setShowModal(false)} onSaved={()=>{setShowModal(false);fetchAll();}} tipos={tipos} categorias={categorias} catalogo={catalogo} centroId={centro.id} onCatalogoChange={onCatalogoChange}/>}
    </div>
  );
}

function ResumenCentroView({ centro, tipos }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data } = await supabase.from("vista_resumen_centro").select("*").eq("centro_id",centro.id);
      setData(data||[]);
      setLoading(false);
    })();
  },[centro.id]);

  const toggle = id => setExpandidos(e=>({...e,[id]:!e[id]}));
  const porTipo = {};
  data.forEach(r=>{ if(!porTipo[r.tipo_id]) porTipo[r.tipo_id]={nombre:r.tipo_nombre,icono:r.tipo_icono,items:[]}; porTipo[r.tipo_id].items.push(r); });

  const totalCant = data.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0);
  const totalPeso = data.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
  const totalVol = data.reduce((s,r)=>s+(parseFloat(r.volumen_total_m3)||0),0);

  return (
    <div className="content">
      <div className="page-header"><div className="page-header-text"><h2>Resumen de mi Centro</h2><p>Conteo consolidado de {centro.nombre}</p></div></div>
      <div className="stats-grid mb-6">
        <div className="stat-card accent-blue"><div className="stat-label">Total unidades</div><div className="stat-value">{totalCant.toLocaleString()}</div></div>
        <div className="stat-card accent-amber"><div className="stat-label">Peso total</div><div className="stat-value">{totalPeso.toFixed(1)}</div><div className="stat-sub">kilogramos</div></div>
        <div className="stat-card accent-navy"><div className="stat-label">Volumen total</div><div className="stat-value">{totalVol.toFixed(3)}</div><div className="stat-sub">m³</div></div>
        <div className="stat-card accent-green"><div className="stat-label">Tipos con stock</div><div className="stat-value">{Object.keys(porTipo).length}</div></div>
      </div>
      {loading ? <div className="empty-state"><p>Calculando resumen...</p></div>
      : Object.keys(porTipo).length===0 ? <div className="empty-state"><div style={{fontSize:48}}>📊</div><h3>Sin datos</h3><p>Registra donaciones para ver el resumen.</p></div>
      : Object.entries(porTipo).map(([tipoId,grupo])=>{
        const subtotalCant=grupo.items.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0);
        const subtotalPeso=grupo.items.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
        return (
          <div key={tipoId} className="tipo-section">
            <div className="tipo-header" onClick={()=>toggle(tipoId)}>
              <h3><Ico name={grupo.icono} size={16}/> {grupo.nombre}</h3>
              <div className="tipo-meta">
                <span><strong>{subtotalCant.toLocaleString()}</strong> uds</span>
                <span><strong>{subtotalPeso.toFixed(1)}</strong> kg</span>
                <span>{expandidos[tipoId]?"▲":"▼"}</span>
              </div>
            </div>
            {expandidos[tipoId]&&(
              <div className="tipo-body">
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResumenGlobalView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const { data } = await supabase.from("vista_resumen_global").select("*");
      setData(data||[]);
      setLoading(false);
    })();
  },[]);

  const toggle = id => setExpandidos(e=>({...e,[id]:!e[id]}));
  const porTipo = {};
  data.forEach(r=>{ if(!porTipo[r.tipo_id]) porTipo[r.tipo_id]={nombre:r.tipo_nombre,icono:r.tipo_icono,items:[]}; porTipo[r.tipo_id].items.push(r); });
  const totalCant=data.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0);
  const totalPeso=data.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);

  return (
    <div className="content">
      <div className="page-header"><div className="page-header-text"><h2>Resumen Global 🌍</h2><p>Suma de todos los centros aprobados — solo lectura</p></div></div>
      <div className="alert alert-info mb-4">👁 Vista de solo lectura. Muestra en tiempo real la suma de todos los centros de acopio aprobados.</div>
      <div className="stats-grid mb-6">
        <div className="stat-card accent-blue"><div className="stat-label">Total unidades (global)</div><div className="stat-value">{totalCant.toLocaleString()}</div></div>
        <div className="stat-card accent-amber"><div className="stat-label">Peso global</div><div className="stat-value">{totalPeso.toFixed(1)}</div><div className="stat-sub">kg</div></div>
        <div className="stat-card accent-green"><div className="stat-label">Tipos de producto</div><div className="stat-value">{Object.keys(porTipo).length}</div></div>
      </div>
      {loading ? <div className="empty-state"><p>Cargando datos globales...</p></div>
      : Object.keys(porTipo).length===0 ? <div className="empty-state"><div style={{fontSize:48}}>🌍</div><h3>Sin datos globales</h3><p>Aparecerá aquí cuando los centros aprobados registren donaciones.</p></div>
      : Object.entries(porTipo).map(([tipoId,grupo])=>{
        const sub=grupo.items.reduce((s,r)=>s+(parseInt(r.cantidad_total)||0),0);
        const subP=grupo.items.reduce((s,r)=>s+(parseFloat(r.peso_total_kg)||0),0);
        return (
          <div key={tipoId} className="tipo-section">
            <div className="tipo-header" onClick={()=>toggle(tipoId)}>
              <h3><Ico name={grupo.icono} size={16}/> {grupo.nombre}</h3>
              <div className="tipo-meta"><span><strong>{sub.toLocaleString()}</strong> uds</span><span><strong>{subP.toFixed(1)}</strong> kg</span><span>{expandidos[tipoId]?"▲":"▼"}</span></div>
            </div>
            {expandidos[tipoId]&&(
              <div className="tipo-body">
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MODAL: REGISTRAR/EDITAR CAJA DE EMBALAJE ─────────────────────────────────
function ModalCaja({ onClose, onSaved, tipos, categorias, centroId, cajaExistente }) {
  const [form, setForm] = useState({
    tipo_id: cajaExistente?.tipo_id || "",
    categoria_id: cajaExistente?.categoria_id || "",
    numero_caja: cajaExistente?.numero_caja || "",
    largo_cm: cajaExistente?.largo_cm || "",
    ancho_cm: cajaExistente?.ancho_cm || "",
    alto_cm: cajaExistente?.alto_cm || "",
    peso_kg: cajaExistente?.peso_kg || "",
    contenido_resumen: cajaExistente?.contenido_resumen || "",
    estado: cajaExistente?.estado || "empacado",
    fecha_empaque: cajaExistente?.fecha_empaque || new Date().toISOString().split("T")[0],
    observaciones: cajaExistente?.observaciones || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const catsFiltradas = categorias.filter(c=>c.tipo_id===form.tipo_id);

  const volumenCalculado = () => {
    const l=parseFloat(form.largo_cm), a=parseFloat(form.ancho_cm), h=parseFloat(form.alto_cm);
    if (l && a && h) return ((l*a*h)/1000000).toFixed(6);
    return null;
  };

  const handleSave = async () => {
    if (!centroId) { setError("Tu cuenta no tiene un centro de acopio asignado."); return; }
    if (!form.tipo_id || !form.categoria_id || !form.peso_kg) {
      setError("Completa: Tipo, Categoría y Peso de la caja."); return;
    }
    setError(""); setLoading(true);
    const payload = {
      centro_id: centroId,
      tipo_id: form.tipo_id,
      categoria_id: form.categoria_id,
      numero_caja: form.numero_caja || null,
      largo_cm: form.largo_cm ? parseFloat(form.largo_cm) : null,
      ancho_cm: form.ancho_cm ? parseFloat(form.ancho_cm) : null,
      alto_cm: form.alto_cm ? parseFloat(form.alto_cm) : null,
      peso_kg: parseFloat(form.peso_kg),
      contenido_resumen: form.contenido_resumen || null,
      estado: form.estado,
      fecha_empaque: form.fecha_empaque,
      observaciones: form.observaciones || null,
    };
    let err;
    if (cajaExistente) {
      ({ error: err } = await supabase.from("cajas_embalaje").update(payload).eq("id", cajaExistente.id));
    } else {
      ({ error: err } = await supabase.from("cajas_embalaje").insert(payload));
    }
    if (err) { setError(err.message); setLoading(false); return; }
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{cajaExistente ? "Editar Caja de Embalaje" : "Registrar Caja de Embalaje"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            📦 Registra aquí el peso y volumen <strong>real medido</strong> de una caja física ya empacada
            (báscula y cinta métrica), agrupando todo lo de una misma categoría.
          </div>

          <div className="section-label">Clasificación de la caja</div>
          <div className="type-tabs mb-4">
            {tipos.map(t=>(
              <button key={t.id} className={`type-tab ${form.tipo_id===t.id?"active":""}`}
                onClick={()=>{set("tipo_id",t.id);set("categoria_id","");}}>
                <Ico name={t.icono} size={13}/> {t.nombre}
              </button>
            ))}
          </div>

          {form.tipo_id && (
            <div className="form-grid mb-4">
              <div className="field">
                <label>Categoría <span className="req">*</span></label>
                <select value={form.categoria_id} onChange={e=>set("categoria_id",e.target.value)}>
                  <option value="">— Selecciona —</option>
                  {catsFiltradas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Número / Etiqueta de caja</label>
                <input value={form.numero_caja} onChange={e=>set("numero_caja",e.target.value)} placeholder="Ej: CAJA-001"/>
              </div>
            </div>
          )}

          <div className="section-label">Contenido</div>
          <div className="field mb-4">
            <label>Resumen del contenido</label>
            <input value={form.contenido_resumen} onChange={e=>set("contenido_resumen",e.target.value)}
              placeholder="Ej: Ibuprofeno, Paracetamol, Naproxeno (bolsas ziploc)"/>
          </div>

          <div className="section-label">Peso y Volumen Real</div>
          <div className="form-grid-3 mb-2">
            <div className="field">
              <label>Largo (cm)</label>
              <input type="number" step="0.1" min="0" value={form.largo_cm} onChange={e=>set("largo_cm",e.target.value)} placeholder="40"/>
            </div>
            <div className="field">
              <label>Ancho (cm)</label>
              <input type="number" step="0.1" min="0" value={form.ancho_cm} onChange={e=>set("ancho_cm",e.target.value)} placeholder="30"/>
            </div>
            <div className="field">
              <label>Alto (cm)</label>
              <input type="number" step="0.1" min="0" value={form.alto_cm} onChange={e=>set("alto_cm",e.target.value)} placeholder="25"/>
            </div>
          </div>
          {volumenCalculado() && (
            <div className="alert alert-info mb-3" style={{fontSize:12.5}}>
              📐 Volumen calculado: <strong>{volumenCalculado()} m³</strong>
            </div>
          )}
          <div className="field mb-4">
            <label>Peso real en báscula (kg) <span className="req">*</span></label>
            <input type="number" step="0.001" min="0" value={form.peso_kg} onChange={e=>set("peso_kg",e.target.value)} placeholder="Ej: 8.400"/>
          </div>

          <div className="section-label">Estado y Observaciones</div>
          <div className="form-grid">
            <div className="field">
              <label>Fecha de empaque</label>
              <input type="date" value={form.fecha_empaque} onChange={e=>set("fecha_empaque",e.target.value)}/>
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={form.estado} onChange={e=>set("estado",e.target.value)}>
                <option value="empacado">Empacado</option>
                <option value="listo_para_envio">Listo para envío</option>
                <option value="enviado">Enviado</option>
              </select>
            </div>
            <div className="field form-full">
              <label>Observaciones</label>
              <textarea value={form.observaciones} onChange={e=>set("observaciones",e.target.value)} rows={2}
                placeholder="Notas adicionales sobre esta caja..."/>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Guardando...</>:cajaExistente?"Guardar Cambios":"Registrar Caja"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA: CAJAS DE EMBALAJE ──────────────────────────────────────────────────
function CajasEmbalajeView({ centro, tipos, categorias }) {
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("all");

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("cajas_embalaje")
      .select("*").eq("centro_id", centro.id).order("created_at", { ascending: false });
    setCajas(data || []);
    setLoading(false);
  }, [centro.id]);

  useEffect(() => { fetchCajas(); }, [fetchCajas]);

  const getNombre = (id, arr) => arr.find(a=>a.id===id)?.nombre || "—";
  const filtradas = filtroTipo === "all" ? cajas : cajas.filter(c=>c.tipo_id===filtroTipo);

  const totalPeso = filtradas.reduce((s,c)=>s+(parseFloat(c.peso_kg)||0),0);
  const totalVol = filtradas.reduce((s,c)=>s+(parseFloat(c.volumen_m3)||0),0);

  const cambiarEstado = async (id, estado) => {
    await supabase.from("cajas_embalaje").update({estado}).eq("id", id);
    setCajas(prev=>prev.map(c=>c.id===id?{...c,estado}:c));
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta caja registrada? No se puede deshacer.")) return;
    await supabase.from("cajas_embalaje").delete().eq("id", id);
    setCajas(prev=>prev.filter(c=>c.id!==id));
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Cajas de Embalaje</h2>
          <p>Peso y volumen real medido de cada caja física empacada · {centro.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditando(null);setShowModal(true);}} disabled={centro.estado!=="aprobado"}>
          ＋ Registrar Caja
        </button>
      </div>

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
                  <th>Caja</th><th>Tipo</th><th>Categoría</th><th>Contenido</th>
                  <th>Dimensiones (cm)</th><th>Volumen (m³)</th><th>Peso (kg)</th>
                  <th>Fecha</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontWeight:600}}>{c.numero_caja || "—"}</td>
                    <td style={{fontSize:12}}>{getNombre(c.tipo_id, tipos)}</td>
                    <td style={{fontSize:12}}>{getNombre(c.categoria_id, categorias)}</td>
                    <td style={{fontSize:12,maxWidth:200}}>{c.contenido_resumen || "—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>
                      {c.largo_cm&&c.ancho_cm&&c.alto_cm ? `${c.largo_cm}×${c.ancho_cm}×${c.alto_cm}` : "—"}
                    </td>
                    <td style={{fontSize:12}}>{c.volumen_m3 ? parseFloat(c.volumen_m3).toFixed(5) : "—"}</td>
                    <td style={{fontWeight:600}}>{parseFloat(c.peso_kg).toFixed(2)}</td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ModalCaja
          onClose={()=>{setShowModal(false);setEditando(null);}}
          onSaved={()=>{setShowModal(false);setEditando(null);fetchCajas();}}
          tipos={tipos} categorias={categorias} centroId={centro.id}
          cajaExistente={editando}
        />
      )}
    </div>
  );
}

function ManifiestoView({ centro }) {
  const [modo, setModo] = useState("estimado"); // "estimado" | "real"
  const [dataEstimado, setDataEstimado] = useState([]);
  const [dataReal, setDataReal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("listo_para_envio");

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const [{ data: est }, { data: real }] = await Promise.all([
        supabase.from("vista_manifiesto").select("*").eq("centro_id",centro.id),
        supabase.from("vista_manifiesto_real").select("*").eq("centro_id",centro.id),
      ]);
      setDataEstimado(est||[]);
      setDataReal(real||[]);
      setLoading(false);
    })();
  },[centro.id]);

  const data = modo === "estimado" ? dataEstimado : dataReal;
  const filtrados = filtroEstado==="all" ? data : data.filter(d=>d.estado===filtroEstado);
  const totalPeso = modo === "estimado"
    ? filtrados.reduce((s,d)=>s+(parseFloat(d.peso_total_kg)||0),0)
    : filtrados.reduce((s,d)=>s+(parseFloat(d.peso_kg)||0),0);
  const totalVol = modo === "estimado"
    ? filtrados.reduce((s,d)=>s+(parseFloat(d.volumen_total_m3)||0),0)
    : filtrados.reduce((s,d)=>s+(parseFloat(d.volumen_m3)||0),0);

  const exportCSV = () => {
    let headers, rows;
    if (modo === "estimado") {
      headers=["Tipo","Categoría","Producto","Presentación","Unidad","Talla","Cantidad","Uds.Mín.","Peso Unit.(kg)","Peso Total(kg)","Vol.Total(m³)","Estado","Fecha","Observaciones"];
      rows=filtrados.map(d=>[d.tipo_nombre,d.categoria_nombre,d.nombre_producto,d.presentacion_mg||"",d.unidad,d.talla||"",d.cantidad_total,d.total_unidades_minimas||"",d.peso_unitario_kg,d.peso_total_kg,d.volumen_total_m3,d.estado,d.fecha_ingreso,d.observaciones||""]);
    } else {
      headers=["Caja","Tipo","Categoría","Contenido","Largo(cm)","Ancho(cm)","Alto(cm)","Volumen(m³)","Peso(kg)","Estado","Fecha Empaque","Observaciones"];
      rows=filtrados.map(d=>[d.numero_caja||"",d.tipo_nombre,d.categoria_nombre,d.contenido_resumen||"",d.largo_cm||"",d.ancho_cm||"",d.alto_cm||"",d.volumen_m3||"",d.peso_kg,d.estado,d.fecha_empaque,d.observaciones||""]);
    }
    const csv=[headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url;
    a.download=`manifiesto_${modo}_${centro.nombre.replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text"><h2>Manifiesto de Carga</h2><p>Listado para aerolíneas, aduana y logística</p></div>
        <button className="btn btn-success" onClick={exportCSV} disabled={filtrados.length===0}>↓ Exportar CSV</button>
      </div>

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
            <div className="stat-card accent-blue" style={{padding:"10px 16px",minWidth:80}}><div className="stat-label">Líneas</div><div className="stat-value" style={{fontSize:18}}>{filtrados.length}</div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>{centro.nombre} → Venezuela</h3></div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtrados.length===0 ? <div className="empty-state"><div style={{fontSize:48}}>📋</div><h3>Sin registros para este estado</h3></div>
          : modo === "estimado" ? (
            <table>
              <thead><tr><th>#</th><th>Tipo</th><th>Categoría</th><th>Producto</th><th>Conc.</th><th>Unidad</th><th>Talla</th><th>Cantidad</th><th>Uds.Mín.</th><th>Peso Unit.</th><th>Peso Total</th><th>Volumen</th></tr></thead>
              <tbody>
                {filtrados.map((d,i)=>(
                  <tr key={d.id}>
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
                  <td colSpan={10} style={{textAlign:"right",color:"var(--navy)",paddingRight:16}}>TOTALES</td>
                  <td style={{color:"var(--navy)"}}>{totalPeso.toFixed(3)} kg</td>
                  <td style={{color:"var(--navy)"}}>{totalVol.toFixed(5)} m³</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table>
              <thead><tr><th>#</th><th>Caja</th><th>Tipo</th><th>Categoría</th><th>Contenido</th><th>Dimensiones</th><th>Volumen</th><th>Peso Real</th></tr></thead>
              <tbody>
                {filtrados.map((d,i)=>(
                  <tr key={d.id}>
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
                  <td colSpan={6} style={{textAlign:"right",color:"var(--navy)",paddingRight:16}}>TOTALES</td>
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

function AdminView({ usuario }) {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCentros = async () => {
    setLoading(true);
    const { data } = await supabase.from("centros_acopio").select("*").order("created_at",{ascending:false});
    setCentros(data||[]);
    setLoading(false);
  };
  useEffect(()=>{ fetchCentros(); },[]);

  const cambiarEstado = async (id,estado) => {
    await supabase.rpc("cambiar_estado_centro",{p_centro_id:id,p_estado:estado});
    fetchCentros();
  };

  if(usuario?.rol!=="admin_global") return (
    <div className="content"><div className="empty-state"><div style={{fontSize:48}}>🔑</div><h3>Acceso restringido</h3><p>Solo el administrador global puede ver esta sección.</p></div></div>
  );

  const pendientes=centros.filter(c=>c.estado==="pendiente");

  return (
    <div className="content">
      <div className="page-header"><div className="page-header-text"><h2>Administración</h2><p>Gestión de centros de acopio</p></div></div>
      {pendientes.length>0&&<div className="alert alert-warning mb-4">⏳ <strong>{pendientes.length}</strong> centro{pendientes.length>1?"s":""} pendiente{pendientes.length>1?"s":""} de aprobación.</div>}
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

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function AppShell({ usuario, centro, tipos, categorias, catalogo, onCatalogoChange }) {
  const [vista, setVista] = useState("dashboard");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const isAdmin = usuario?.rol==="admin_global";
  const logout = () => supabase.auth.signOut();

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

  return (
    <div className="app">
      <div className={`mobile-topbar`}>
        <button className="hamburger-btn" onClick={()=>setSidebarAbierto(true)} aria-label="Abrir menú">
          <span/><span/><span/>
        </button>
        <div className="mobile-topbar-title">🇻🇪 {tituloActual}</div>
      </div>

      <div className={`sidebar-overlay ${sidebarAbierto?"open":""}`} onClick={()=>setSidebarAbierto(false)}/>

      <aside className={`sidebar ${sidebarAbierto?"open":""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-flag">🇻🇪</div>
          <h1>AcopioVen</h1>
          <p>Ayuda Humanitaria</p>
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
      <main className="main">
        {vista==="dashboard"&&<Dashboard centro={centro} tipos={tipos} categorias={categorias} catalogo={catalogo} onCatalogoChange={onCatalogoChange}/>}
        {vista==="inventario"&&<InventarioView centro={centro} tipos={tipos} categorias={categorias} catalogo={catalogo} onCatalogoChange={onCatalogoChange}/>}
        {vista==="cajas"&&<CajasEmbalajeView centro={centro} tipos={tipos} categorias={categorias}/>}
        {vista==="resumen-centro"&&<ResumenCentroView centro={centro} tipos={tipos}/>}
        {vista==="resumen-global"&&<ResumenGlobalView/>}
        {vista==="manifiesto"&&<ManifiestoView centro={centro}/>}
        {vista==="admin"&&<AdminView usuario={usuario}/>}
      </main>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function AcopioVen() {
  const [session, setSession] = useState(undefined);
  const [usuario, setUsuario] = useState(null);
  const [centro, setCentro] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [booting, setBooting] = useState(true);

  const recargarCatalogoCompleto = useCallback(async () => {
    const [{data:t},{data:cat},{data:prod}] = await Promise.all([
      supabase.from("tipos_producto").select("*").eq("activo",true).order("orden"),
      supabase.from("categorias").select("*").eq("activo",true).order("orden"),
      supabase.from("catalogo_productos").select("*").eq("activo",true).order("nombre"),
    ]);
    setTipos(t||[]);
    setCategorias(cat||[]);
    setCatalogo(prod||[]);
  }, []);

  // Inyectar CSS global
  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=CSS;
    document.head.appendChild(style);
    return ()=>document.head.removeChild(style);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setSession(session));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(session===undefined) return;
    if(!session){ setBooting(false); return; }
    (async()=>{
      setBooting(true);
      const {data:usr}=await supabase.from("usuarios").select("*").eq("id",session.user.id).single();
      setUsuario(usr);
      if(usr?.centro_id){
        const {data:c}=await supabase.from("centros_acopio").select("*").eq("id",usr.centro_id).single();
        setCentro(c);
      } else if(usr?.rol==="admin_global"){
        setCentro({id:null,nombre:"Administración Global",estado:"aprobado"});
      }
      await recargarCatalogoCompleto();
      setBooting(false);
    })();
  },[session, recargarCatalogoCompleto]);

  if(session===undefined||booting){
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f1f3d"}}>
        <div style={{textAlign:"center",color:"white"}}>
          <div style={{fontSize:48,marginBottom:16}}>🇻🇪</div>
          <div style={{fontFamily:"system-ui",fontSize:15,opacity:.6}}>Cargando AcopioVen...</div>
        </div>
      </div>
    );
  }

  if(!session) return <AuthView/>;

  if(!centro){
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
        <div style={{background:"white",borderRadius:12,padding:32,maxWidth:380,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.1)"}}>
          <div style={{fontSize:48,marginBottom:12}}>⏳</div>
          <h2 style={{fontFamily:"system-ui",marginBottom:8,color:"#0f172a"}}>Cuenta en revisión</h2>
          <p style={{color:"#64748b",marginBottom:20,fontSize:14}}>Tu centro de acopio está pendiente de aprobación. Regresa pronto.</p>
          <button className="btn btn-secondary" onClick={()=>supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return <AppShell usuario={usuario} centro={centro} tipos={tipos} categorias={categorias} catalogo={catalogo} onCatalogoChange={recargarCatalogoCompleto}/>;
}
