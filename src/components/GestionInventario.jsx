import { useState } from "react";
import { ModuleHeader, Icon } from "./UIPrimitives";
import RefaccionesModule from "./RefaccionesModule";
import CompraRefacciones from "./CompraRefacciones";
import VentaRefacciones from "./VentaRefacciones";
import ProveedoresModule from "./ProveedoresModule";

export default function GestionInventario({ darkMode, role }) {
  const [activeTab, setActiveTab] = useState("refacciones");

  const tabs = [
    { id: "refacciones", label: "Catálogo", icon: "box" },
    { id: "compras", label: "Compras", icon: "receipt" },
    { id: "ventas", label: "Ventas", icon: "shoppingcart" },
    ...(role === "administrador" ? [{ id: "proveedores", label: "Proveedores", icon: "tag" }] : []),
  ];

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const activeBg = darkMode ? "bg-zinc-800/80 shadow-lg shadow-black/20" : "bg-white shadow-sm";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ModuleHeader 
        title="Gestión de Inventario" 
        subtitle="Administra el catálogo de refacciones, compras, ventas y proveedores del taller."
        darkMode={darkMode}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-500/5 w-fit border border-zinc-500/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap
                ${activeTab === tab.id ? `${t} ${activeBg}` : `${st} hover:text-zinc-400`}
              `}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="anim-fadeUp">
        {activeTab === "refacciones" && (
          <div className="space-y-4">
            <RefaccionesModule darkMode={darkMode} readOnly={role !== "administrador"} allowStockEdit={false} />
          </div>
        )}
        {activeTab === "compras" && (
          <div className="space-y-4">
            <CompraRefacciones darkMode={darkMode} />
          </div>
        )}
        {activeTab === "ventas" && (
          <div className="space-y-4">
            <VentaRefacciones darkMode={darkMode} />
          </div>
        )}
        {activeTab === "proveedores" && role === "administrador" && (
          <div className="space-y-4">
            <ProveedoresModule darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
}
