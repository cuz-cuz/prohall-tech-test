const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  products: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" /><path d="M12 11v10" /></>,
  listings: <><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8.5" cy="8.5" r="1" /></>,
  menus: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r=".5" /><circle cx="3.5" cy="12" r=".5" /><circle cx="3.5" cy="18" r=".5" /></>,
  banners: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 15 5-5 4 4 3-3 6 6" /></>,
  import: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19h16" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  play: <path d="m7 4 13 8-13 8Z" />,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  store: <><path d="M3 9 5 4h14l2 5" /><path d="M5 13v7h14v-7M9 20v-6h6v6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 13 4 4 10-10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
}

export function AdminIcon({ name }) {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}
