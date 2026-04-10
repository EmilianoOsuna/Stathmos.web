import HistorialTickets from "./HistorialTickets";

export default function HistorialTicketsWrapper({ darkMode = false }) {
  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <HistorialTickets darkMode={darkMode} />
    </div>
  );
}
