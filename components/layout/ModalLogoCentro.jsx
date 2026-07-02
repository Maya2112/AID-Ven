"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const LADO_MAX = 320;

// Redimensiona la imagen elegida a un cuadrado de máx. 320px (manteniendo
// proporción) y la reencoda a PNG, para que los logos no infle el bucket
// ni los PDFs con fotos de varios MB directo de un celular.
function redimensionarImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * escala);
      const h = Math.round(img.height * escala);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen."));
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("El archivo no es una imagen válida.")); };
    img.src = url;
  });
}

export default function ModalLogoCentro({ centroId, logoUrl, onClose, onSaved }) {
  const [preview, setPreview] = useState(logoUrl || null);
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const elegirArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Elige un archivo de imagen (PNG, JPG o WEBP)."); return; }
    setError("");
    try {
      const blob = await redimensionarImagen(file);
      setArchivo(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
    }
  };

  const guardar = async () => {
    if (!archivo) { setError("Elige una imagen primero."); return; }
    setError(""); setLoading(true);
    try {
      const path = `${centroId}/logo.png`;
      const { error: errSubida } = await supabase.storage
        .from("logos-centros")
        .upload(path, archivo, { upsert: true, contentType: "image/png" });
      if (errSubida) throw errSubida;

      const { data: pub } = supabase.storage.from("logos-centros").getPublicUrl(path);
      const urlConCache = `${pub.publicUrl}?v=${Date.now()}`;

      const { error: errUpdate } = await supabase.from("centros_acopio")
        .update({ logo_url: urlConCache }).eq("id", centroId);
      if (errUpdate) throw errUpdate;

      onSaved(urlConCache);
    } catch (err) {
      setError("No se pudo guardar el logo: " + err.message);
      setLoading(false);
    }
  };

  const quitarLogo = async () => {
    if (!confirm("¿Quitar el logo de tu centro? Los PDFs volverán a usar el encabezado estándar de AcopioVen.")) return;
    setError(""); setLoading(true);
    try {
      await supabase.storage.from("logos-centros").remove([`${centroId}/logo.png`]);
      const { error: errUpdate } = await supabase.from("centros_acopio")
        .update({ logo_url: null }).eq("id", centroId);
      if (errUpdate) throw errUpdate;
      onSaved(null);
    } catch (err) {
      setError("No se pudo quitar el logo: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Logo de tu centro</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            📎 Opcional. Si lo subes, aparecerá automáticamente en el encabezado de tus
            PDFs (Resumen de mi Centro y Manifiesto en modo &ldquo;Mi centro&rdquo;).
          </div>

          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{
              width:120,height:120,borderRadius:12,border:"1px solid var(--slate-200)",
              display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"var(--slate-50)"
            }}>
              {preview
                ? <img src={preview} alt="Logo del centro" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
                : <span style={{fontSize:11,color:"var(--slate-400)",textAlign:"center",padding:8}}>Sin logo</span>}
            </div>
          </div>

          <div className="field">
            <label>Elegir imagen</label>
            <input type="file" accept="image/*" onChange={elegirArchivo}/>
            <span className="hint">Se ajusta automáticamente a un tamaño manejable.</span>
          </div>
        </div>
        <div className="modal-footer">
          {logoUrl && <button className="btn btn-danger" onClick={quitarLogo} disabled={loading}>Quitar logo</button>}
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={loading || !archivo}>
            {loading?<><span className="spinner"/> Guardando...</>:"Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
