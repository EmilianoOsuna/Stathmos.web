import { useParams } from "react-router-dom";
import Ticket from "./Ticket";

export default function TicketWrapper({ darkMode = false }) {
  const { proyectoId } = useParams();
  
  return <Ticket proyectoId={proyectoId} darkMode={darkMode} />;
}
