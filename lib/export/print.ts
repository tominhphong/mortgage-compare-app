/**
 * print.ts
 * PDF-ready print utility using window.print() + CSS @media print.
 * No external PDF library — keeps bundle small.
 * Print stylesheet is added to app/globals.css by convention.
 */

/**
 * Trigger the browser's native print dialog.
 * The @media print CSS in globals.css handles layout:
 * - hides controls, nav, share/print buttons
 * - expands scenario cards to full width
 * - forces light background for ink-friendly output
 */
export function triggerPrint(): void {
  if (typeof window === "undefined") return;
  window.print();
}

/**
 * Print stylesheet snippet — injected into app/globals.css
 * (kept here as a reference / documentation for the integration agent).
 *
 * @media print {
 *   .no-print { display: none !important; }
 *   .print-full { width: 100% !important; break-inside: avoid; }
 *   body { background: #fff !important; color: #000 !important; }
 *   .scenario-card { page-break-inside: avoid; border: 1px solid #ccc; }
 * }
 */
export const PRINT_CSS_SNIPPET = `
@media print {
  .no-print { display: none !important; }
  .print-full { width: 100% !important; break-inside: avoid; }
  body { background: #fff !important; color: #000 !important; font-size: 11pt; }
  .scenario-card {
    page-break-inside: avoid;
    border: 1px solid #ccc;
    margin-bottom: 16px;
    padding: 12px;
  }
  header, footer, nav { display: none !important; }
}
`;
