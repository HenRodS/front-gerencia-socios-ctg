import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all duration-300 font-medium ${
      isActive ? 'bg-white text-[#1a3560] font-semibold' : 'text-white hover:bg-white/15'
    }`

  return (
    <header className="w-full bg-[#1a3560] text-white px-7 py-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.2)] max-md:flex-col max-md:gap-5">
      <div className="flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center font-bold text-[#1a3560] text-sm shrink-0">
          CTG
        </div>
        <div>
          <h2 className="text-2xl font-bold">CTG Raízes da Tradição</h2>
          <p className="text-[13px] opacity-80">Sistema de Gerenciamento</p>
        </div>
      </div>

      <nav className="flex gap-3.5 max-md:flex-wrap max-md:justify-center">
        <NavLink to="/" end className={linkClass}>Painel</NavLink>
        <NavLink to="/socios" className={linkClass}>Sócios</NavLink>
        <NavLink to="/relatorios" className={linkClass}>Relatórios</NavLink>
      </nav>
    </header>
  )
}
