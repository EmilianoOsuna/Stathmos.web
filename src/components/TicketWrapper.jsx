// ─── Wrapper para vista de ticket/proyecto ──────────────────────────────────
// Obtiene el ID del proyecto desde URL params y lo pasa al componente Ticket
// Responsable de inicializar la vista detallada con cotizaciones, pagos y diagnósticos
import { useParams } from "react-router-dom";
import Ticket from "./Ticket";

export default function TicketWrapper({ darkMode = false }) {
  const { proyectoId } = useParams();
  
  return <Ticket proyectoId={proyectoId} darkMode={darkMode} />;
}
