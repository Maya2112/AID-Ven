"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import EstadoBadge from "@/components/ui/EstadoBadge";

export default function AuthView() {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1); // 1: cuenta, 2: centro, 3: confirmar (si hay similares)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [centrosSimilares, setCentrosSimilares] = useState([]);
  const [form, setForm] = useState({
    email:"", password:"", nombre:"",
    centro_nombre:"", ciudad:"", pais:"México",
    contacto_nombre:"", contacto_email:"", contacto_telefono:"",
    codigo_invitacion:""
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const crearCuentaYCentro = async () => {
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
        p_codigo_invitacion: form.codigo_invitacion.trim().toUpperCase(),
      });
      if (centroErr) {
        // La cuenta de inicio de sesion ya se creo, pero el centro no se pudo registrar.
        // Avisamos claramente para que la persona no se quede confundida ni reintente con el mismo correo sin saber por que falla.
        throw new Error(
          "Tu cuenta se creó, pero no pudimos registrar el centro: " + centroErr.message +
          " Por favor contacta al administrador para resolverlo antes de intentar de nuevo."
        );
      }
      setSuccess("¡Cuenta creada! Tu centro quedó pendiente de aprobación. Una vez aprobado tendrás acceso completo.");
    } catch(err) { setError(err.message); }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (step===1) { setStep(2); return; }
    if (step===2) {
      setError(""); setLoading(true);
      // El código de invitación se valida antes de crear la cuenta para no dejar
      // cuentas de auth huérfanas si resulta inválido, usado o expirado.
      const { data: codigoValido, error: codigoErr } = await supabase.rpc("validar_codigo_invitacion", {
        p_codigo: form.codigo_invitacion.trim().toUpperCase(),
      });
      if (codigoErr || !codigoValido) {
        setError("El código de invitación no es válido, ya fue usado o expiró.");
        setLoading(false);
        return;
      }
      // Antes de crear la cuenta, verificamos si ya existe un centro con nombre parecido
      try {
        const { data: similares } = await supabase.rpc("buscar_centros_similares", { p_nombre: form.centro_nombre });
        if (similares && similares.length > 0) {
          setCentrosSimilares(similares);
          setStep(3);
          setLoading(false);
          return;
        }
      } catch(e) { /* si falla la verificacion, dejamos continuar normalmente */ }
      await crearCuentaYCentro();
      return;
    }
    if (step===3) {
      await crearCuentaYCentro();
    }
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
                    <div className="alert alert-info">Paso 1 — Datos de tu cuenta</div>
                    <div className="field"><label>Nombre completo<span className="req">*</span></label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} required /></div>
                    <div className="field"><label>Correo<span className="req">*</span></label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required /></div>
                    <div className="field"><label>Contraseña<span className="req">*</span></label><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} required minLength={6}/><span className="hint">Mínimo 6 caracteres</span></div>
                  </>}
                  {step===2 && <>
                    <div className="alert alert-info">Paso 2 — Datos de tu Centro de Acopio</div>
                    <div className="field">
                      <label>Código de invitación<span className="req">*</span></label>
                      <input value={form.codigo_invitacion} onChange={e=>set("codigo_invitacion",e.target.value.toUpperCase())}
                        required placeholder="Ej: 7XK2QF9M" style={{textTransform:"uppercase",letterSpacing:1}}/>
                      <span className="hint">Solicítalo al administrador de AcopioVen.</span>
                    </div>
                    <div className="field"><label>Nombre del centro<span className="req">*</span></label><input value={form.centro_nombre} onChange={e=>set("centro_nombre",e.target.value)} required placeholder="Ej: Centro de Acopio Norte Cancún"/></div>
                    <div className="grid-2">
                      <div className="field"><label>Ciudad<span className="req">*</span></label><input value={form.ciudad} onChange={e=>set("ciudad",e.target.value)} required placeholder="Cancún"/></div>
                      <div className="field"><label>País<span className="req" style={{visibility:"hidden"}}>*</span></label><input value={form.pais} onChange={e=>set("pais",e.target.value)}/></div>
                    </div>
                    <div className="field"><label>Teléfono de contacto</label><input value={form.contacto_telefono} onChange={e=>set("contacto_telefono",e.target.value)} placeholder="+52 998 000 0000"/></div>
                    <div className="alert alert-warning">⏳ Tu centro quedará <strong>pendiente</strong> hasta que el administrador lo apruebe.</div>
                  </>}
                  {step===3 && <>
                    <div className="alert alert-warning">
                      ⚠️ Encontramos {centrosSimilares.length===1?"un centro":"centros"} ya registrado{centrosSimilares.length===1?"":"s"} con nombre parecido a <strong>&ldquo;{form.centro_nombre}&rdquo;</strong>.
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {centrosSimilares.map(c=>(
                        <div key={c.id} style={{border:"1px solid var(--slate-200)",borderRadius:8,padding:"10px 14px"}}>
                          <div style={{fontWeight:600,fontSize:13.5}}>{c.nombre}</div>
                          <div style={{fontSize:12,color:"var(--slate-500)"}}>{c.ciudad} · <EstadoBadge estado={c.estado}/></div>
                        </div>
                      ))}
                    </div>
                    <div className="alert alert-info" style={{fontSize:12.5}}>
                      Si tu centro ya está registrado, no crees una cuenta nueva — pide las credenciales a la persona
                      que lo registró, o contacta al administrador. Si tu centro es realmente distinto, puedes continuar.
                    </div>
                  </>}
                  <div style={{display:"flex",gap:10}}>
                    {step===2 && <button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}>← Atrás</button>}
                    {step===3 && <button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}>← Corregir nombre</button>}
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{flex:1,justifyContent:"center"}}>
                      {loading?<><span className="spinner"/> Procesando...</>:step===1?"Continuar →":step===2?"Continuar →":"Mi centro es distinto, continuar"}
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
