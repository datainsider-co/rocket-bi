/** v1 `CaretDownIcon.vue`. Turns upside down while its menu is open. */
export function CaretDownIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="currentColor"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M1.18 2.208a.709.709 0 0 0-.96-.04.614.614 0 0 0-.104.83l.063.074L4 7l3.821-3.928a.614.614 0 0 0-.041-.904.711.711 0 0 0-.887-.026l-.073.066L4 5.106 1.18 2.208z" />
    </svg>
  );
}
