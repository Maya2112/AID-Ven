import { NAVY_RGB, SLATE_RGB } from "./constants";

// ─── Limpieza de texto para PDF ──────────────────────────────────────────────
// La fuente base de jsPDF (Helvetica/WinAnsi) no sabe dibujar emojis ni banderas
// (nombres de tipo/centro creados por los propios centros a veces los traen) —
// en vez de imprimir glifos ilegibles, simplemente se quitan del texto.
export function limpiarTextoPDF(texto) {
  if (texto == null) return texto;
  return String(texto)
    .replace(/→/g, "-")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "") // banderas (pares de indicador regional)
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")   // selectores de variación (ej. ❤️)
    .replace(/\s+/g, " ")
    .trim();
}

// Aplica limpiarTextoPDF a cada celda de texto de una tabla (head/body/foot de autoTable).
export function limpiarFilasPDF(filas) {
  return filas.map(fila => fila.map(celda => typeof celda === "string" ? limpiarTextoPDF(celda) : celda));
}

// ─── Carga dinámica de jsPDF (CDN) ───────────────────────────────────────────
// Se carga una sola vez y se cachea para usos subsecuentes.
// No se incluye como dependencia de npm para mantener el bundle inicial liviano.
let _jsPDFLoaded = null;

export function cargarJsPDF() {
  if (_jsPDFLoaded) return _jsPDFLoaded;

  _jsPDFLoaded = new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) {
      resolve(window.jspdf.jsPDF);
      return;
    }
    const s1 = document.createElement("script");
    s1.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      s2.onload = () => resolve(window.jspdf.jsPDF);
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    s1.onerror = reject;
    document.head.appendChild(s1);
  }).catch((e) => {
    // No cacheamos un fallo: si la carga del CDN falla (ej. red inestable),
    // el próximo llamado a cargarJsPDF() debe reintentar en vez de fallar para siempre.
    _jsPDFLoaded = null;
    throw e;
  });

  return _jsPDFLoaded;
}

// ─── Carga de imágenes remotas como data URL (para jsPDF.addImage) ──────────
// jsPDF necesita base64/data URL, no una URL remota. Si falla (red, imagen
// borrada, CORS, etc.) devuelve null en vez de lanzar: el PDF se genera igual,
// simplemente sin logo, para que un logo roto nunca tumbe un export.
export async function cargarImagenComoDataURL(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

// ─── Encabezado estándar ─────────────────────────────────────────────────────
export function dibujarEncabezadoPDF(doc, { titulo, subtitulo, fuenteLabel, logoDataUrl }) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY_RGB);
  doc.rect(0, 0, pageWidth, 22, "F");

  const textX = logoDataUrl ? 32 : 14;
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 14, 4, 14, 14); } catch (e) { /* logo invalido: seguimos sin el */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text("AcopioVen", textX, 10);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Ayuda humanitaria", textX, 15.5);

  const fecha = new Date().toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.setFontSize(8);
  doc.text(`Generado: ${fecha}`, pageWidth - 14, 10, { align: "right" });

  doc.setTextColor(...NAVY_RGB);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(limpiarTextoPDF(titulo), 14, 32);
  doc.setFontSize(9.5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...SLATE_RGB);
  doc.text(limpiarTextoPDF(subtitulo), 14, 38);

  if (fuenteLabel) {
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.setFont(undefined, "bold");
    doc.text(`Fuente: ${limpiarTextoPDF(fuenteLabel)}`, pageWidth - 14, 38, { align: "right" });
  }

  return 44;
}

// ─── Tarjetas de estadísticas ─────────────────────────────────────────────────
export function dibujarStatsPDF(doc, startY, stats) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cardW = (pageWidth - margin * 2 - gap * (stats.length - 1)) / stats.length;
  const cardH = 16;

  stats.forEach((s, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, startY, cardW, cardH, "F");
    doc.setDrawColor(...(s.color || NAVY_RGB));
    doc.setLineWidth(0.8);
    doc.line(x, startY, x + cardW, startY);
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_RGB);
    doc.setFont(undefined, "normal");
    doc.text(s.label.toUpperCase(), x + 3, startY + 5.5);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, "bold");
    doc.text(String(s.value), x + 3, startY + 12);
  });

  return startY + cardH + 8;
}

// ─── Portada: números "hero" grandes (para la primera página de un resumen) ──
export function dibujarStatsGrandesPDF(doc, startY, stats) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cardW = (pageWidth - margin * 2 - gap * (stats.length - 1)) / stats.length;
  const cardH = 26;

  stats.forEach((s, i) => {
    const x = margin + i * (cardW + gap);
    doc.setDrawColor(...(s.color || NAVY_RGB));
    doc.setLineWidth(0.5);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFontSize(24);
    doc.setTextColor(...NAVY_RGB);
    doc.setFont(undefined, "bold");
    doc.text(String(s.value), x + cardW / 2, startY + 15, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_RGB);
    doc.setFont(undefined, "normal");
    doc.text(s.label.toUpperCase(), x + cardW / 2, startY + 21, { align: "center" });
  });

  return startY + cardH + 9;
}

// ─── Pie de página con numeración ────────────────────────────────────────────
export function dibujarPiePDF(doc, nota) {
  nota = limpiarTextoPDF(nota);
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont(undefined, "normal");
    doc.text(nota, 14, pageHeight - 9);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }
}
