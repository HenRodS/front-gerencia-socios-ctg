import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, CreditCard, Menu, X } from 'lucide-react'
import logo from '../../modelos/css/Logo.png'

const links = [
  { to: '/',           label: 'Painel',     icon: LayoutDashboard, end: true },
  { to: '/socios',     label: 'Sócios',     icon: Users },
  { to: '/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/relatorios', label: 'Relatórios', icon: FileText },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botão hambúrguer — apenas mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#1a3560] text-white p-2.5 rounded-xl shadow-lg cursor-pointer border-none"
      >
        <Menu size={20} />
      </button>

      {/* Overlay escuro — apenas mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-60 bg-[#1a3560] text-white flex flex-col z-50
          transition-transform duration-300 ease-in-out
          shadow-[4px_0_24px_rgba(0,0,0,0.18)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-[4px_0_24px_rgba(0,0,0,0.12)]
        `}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="CTG Logo"
              className="w-10 h-10 rounded-full shrink-0 object-contain bg-white p-0.5"
            />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">CTG Raízes da Tradição</p>
              <p className="text-[11px] opacity-60 mt-0.5">Sistema de Gerenciamento</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden text-white/60 hover:text-white cursor-pointer bg-transparent border-none p-0 shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 px-3 mb-3">
            Navegação
          </p>
          {links.map((link) => {
            const { to, label, icon: Icon, end } = link
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#1a3560] font-semibold shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[11px] text-white/35 leading-snug">
            © 2026 CTG Raízes da Tradição
          </p>
          <p className="text-[11px] text-white/25 mt-0.5">Cultivar a tradição</p>
        </div>
      </aside>
    </>
  )
}
