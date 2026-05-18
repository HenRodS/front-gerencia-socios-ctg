import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* overflow-y-auto: scroll fica na área de conteúdo, sidebar permanece fixa */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
