import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "2348012345678";

export default function WhatsAppButton({ message = "Hi! I have a question about a booking on Lekki Tides." }) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-lg hover:bg-[#1EBE5A] transition-colors"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline text-sm font-medium">Chat with us</span>
    </a>
  );
}
