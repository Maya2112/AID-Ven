import { supabase } from "./supabase";

// Busca una caja de embalaje por su número dentro del centro; si no existe, la crea
// (sin peso — el trigger de la base de datos lo va sumando según las donaciones que
// se le vayan asignando). Se usa tanto al registrar una donación como al reasignar
// la caja de una ya existente.
export async function buscarOCrearCaja({ centroId, numeroCaja, tipoId, categoriaId }) {
  const numero = numeroCaja?.trim();
  if (!numero) return { cajaId: null, error: null };

  const { data: existente, error: errBuscar } = await supabase
    .from("cajas_embalaje")
    .select("id")
    .eq("centro_id", centroId)
    .eq("numero_caja", numero)
    .maybeSingle();
  if (errBuscar) return { cajaId: null, error: errBuscar };
  if (existente) return { cajaId: existente.id, error: null };

  const { data: nueva, error: errCrear } = await supabase
    .from("cajas_embalaje")
    .insert({ centro_id: centroId, numero_caja: numero, tipo_id: tipoId, categoria_id: categoriaId, peso_auto: true })
    .select("id")
    .single();
  if (!errCrear) return { cajaId: nueva.id, error: null };

  // Otro dispositivo pudo crear esa misma caja entre el "buscar" y el "crear" de arriba
  // (dos personas del mismo centro tecleando el mismo número casi al mismo tiempo).
  // En vez de mostrar el error crudo de la restricción única, usamos la caja que ya existe.
  if (errCrear.code === "23505") {
    const { data: existenteAhora, error: errReintento } = await supabase
      .from("cajas_embalaje")
      .select("id")
      .eq("centro_id", centroId)
      .eq("numero_caja", numero)
      .maybeSingle();
    if (existenteAhora) return { cajaId: existenteAhora.id, error: null };
    return { cajaId: null, error: errReintento || errCrear };
  }
  return { cajaId: null, error: errCrear };
}
