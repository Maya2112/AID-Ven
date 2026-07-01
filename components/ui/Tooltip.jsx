"use client";

/**
 * Ícono de ayuda (?) que muestra un tooltip al hacer hover.
 * Usado principalmente en el formulario de donación para explicar categorías.
 */
export default function Tooltip({ text }) {
  return (
    <span className="tooltip-icon">
      ?
      <span className="tooltip-box">{text}</span>
    </span>
  );
}
