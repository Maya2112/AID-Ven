import { NAVY_RGB, SLATE_RGB } from "./constants";

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

// ─── Encabezado estándar ─────────────────────────────────────────────────────
export function dibujarEncabezadoPDF(doc, { titulo, subtitulo, fuenteLabel }) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY_RGB);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text("AcopioVen", 14, 10);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Ayuda humanitaria", 14, 15.5);

  const fecha = new Date().toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.setFontSize(8);
  doc.text(`Generado: ${fecha}`, pageWidth - 14, 10, { align: "right" });

  doc.setTextColor(...NAVY_RGB);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(titulo, 14, 32);
  doc.setFontSize(9.5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...SLATE_RGB);
  doc.text(subtitulo, 14, 38);

  if (fuenteLabel) {
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.setFont(undefined, "bold");
    doc.text(`Fuente: ${fuenteLabel}`, pageWidth - 14, 38, { align: "right" });
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

// ─── Pie de página con numeración ────────────────────────────────────────────
export function dibujarPiePDF(doc, nota) {
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
