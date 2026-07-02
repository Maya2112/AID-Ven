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
  return { cajaId: nueva?.id ?? null, error: errCrear };
}
