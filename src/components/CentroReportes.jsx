import { useState } from "react";
import ReporteFinancieroModule from "./ReporteFinancieroModule";
import ReportesOperativosModule from "./ReportesOperativosModule";
import { Icon } from "./UIPrimitives";

export default function CentroReportes({ darkMode }) {
  const [activeTab, setActiveTab] = useState("financiero");

  const tabs = [
    { id: "financiero", label: "Financiero", icon: "dollar" },
    { id: "operativo", label: "Operativo", icon: "chart" },
  ];

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const bg = darkMode ? "bg-[#16161e]" : "bg-gray-50";
  const activeBg = darkMode ? "bg-zinc-800/80 shadow-lg shadow-black/20" : "bg-white shadow-sm";

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      {/* Tab Switcher - Premium Header style */}
      <div className={`px-6 pt-6 pb-2 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-500/5 w-fit border border-zinc-500/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300
                ${activeTab === tab.id ? `${t} ${activeBg}` : `${st} hover:text-zinc-400`}
              `}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === "financiero" && <ReporteFinancieroModule darkMode={darkMode} />}
        {activeTab === "operativo" && <ReportesOperativosModule darkMode={darkMode} />}
      </div>
    </div>
  );
}
