"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AuthView from "@/components/auth/AuthView";
import AppShell from "@/components/layout/AppShell";

/**
 * Componente raíz de la aplicación.
 *
 * Responsabilidades:
 * - Gestionar el estado de autenticación (sesión de Supabase)
 * - Cargar los datos globales necesarios para toda la app (tipos, categorías, catálogo)
 * - Decidir qué vista mostrar según el estado de auth y aprobación del centro
 *
 * No contiene lógica de negocio ni UI propia —
 * delega todo a AuthView o AppShell según corresponda.
 */
export default function AcopioVen() {
  const [session, setSession] = useState(undefined);
  const [usuario, setUsuario] = useState(null);
  const [centro, setCentro] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [booting, setBooting] = useState(true);

  // Recarga el catálogo completo (tipos, categorías y productos).
  // Se expone hacia abajo para que los componentes puedan refrescar
  // cuando se agrega un tipo/categoría nuevo durante la captura.
  const recargarCatalogoCompleto = useCallback(async () => {
    const [{ data: t }, { data: cat }, { data: prod }] = await Promise.all([
      supabase.from("tipos_producto").select("*").eq("activo", true).order("orden"),
      supabase.from("categorias").select("*").eq("activo", true).order("orden"),
      supabase.from("catalogo_productos").select("*").eq("activo", true).order("nombre"),
    ]);
    setTipos(t || []);
    setCategorias(cat || []);
    setCatalogo(prod || []);
  }, []);

  // Suscripción al estado de autenticación de Supabase
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setSession(session));

    return () => subscription.unsubscribe();
  }, []);

  // Carga los datos del usuario y el catálogo cuando hay sesión activa
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setBooting(false);
      return;
    }

    (async () => {
      setBooting(true);

      const { data: usr } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUsuario(usr);

      if (usr?.centro_id) {
        const { data: c } = await supabase
          .from("centros_acopio")
          .select("*")
          .eq("id", usr.centro_id)
          .single();
        setCentro(c);
      } else if (usr?.rol === "admin_global") {
        // El admin global no pertenece a un centro específico,
        // pero necesita un objeto centro para que AppShell funcione.
        setCentro({ id: null, nombre: "Administración Global", estado: "aprobado" });
      }

      await recargarCatalogoCompleto();
      setBooting(false);
    })();
  }, [session, recargarCatalogoCompleto]);

  // Solo tipos y categorías APROBADOS se ofrecen en el formulario de captura.
  // Los rechazados siguen siendo visibles en el Inventario (para no perder datos históricos)
  // pero no se pueden elegir para donaciones nuevas.
  const tiposParaCaptura = tipos.filter((t) => t.estado_moderacion === "aprobado");
  const categoriasParaCaptura = categorias.filter(
    (c) => c.estado_moderacion === "aprobado"
  );

  // ─── Estados de carga ────────────────────────────────────────────────────────
  if (session === undefined || booting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1f3d",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🇻🇪</div>
          <div style={{ fontFamily: "system-ui", fontSize: 15, opacity: 0.6 }}>
            Cargando AcopioVen...
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <AuthView />;

  // Centro pendiente de aprobación (o en revisión)
  if (!centro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            maxWidth: 380,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,.1)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2
            style={{
              fontFamily: "system-ui",
              marginBottom: 8,
              color: "#0f172a",
            }}
          >
            Cuenta en revisión
          </h2>
          <p
            style={{
              color: "#64748b",
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            Tu centro de acopio está pendiente de aprobación. Regresa pronto.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => supabase.auth.signOut()}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      usuario={usuario}
      centro={centro}
      tipos={tipos}
      categorias={categorias}
      tiposParaCaptura={tiposParaCaptura}
      categoriasParaCaptura={categoriasParaCaptura}
      catalogo={catalogo}
      onCatalogoChange={recargarCatalogoCompleto}
    />
  );
}
