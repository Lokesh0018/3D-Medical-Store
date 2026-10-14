/** Inline stroke icons (decorative unless a `title` is passed). */
const PATHS = {
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  pill: 'M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7zM8.5 8.5l7 7',
  leaf: 'M5 21c0-9 6-15 15-16-1 9-7 15-15 16zM5 21l8-8',
  device: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8v5H8zM12 16h.01',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  baby: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM5 21a7 7 0 0 1 14 0M10 8h.01M14 8h.01',
  aid: 'M4 7h16v13H4zM9 7V4h6v3M12 10v7M8.5 13.5h7',
  rx: 'M6 20V4h5a4 4 0 0 1 0 8H6M10 12l8 8M18 12l-6 8',
  delivery: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  chat: 'M4 5h16v11H9l-5 4z',
  cart: 'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l5 5 9-10',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
}

export default function Icon({ name, size = 20, title, className, strokeWidth = 1.8 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name] ?? PATHS.cross} />
    </svg>
  )
}
