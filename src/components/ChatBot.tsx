import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, MessageCircle, RotateCcw, Sparkles, Square, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../App';

const SUGGESTIONS = [
  '¿Qué tipo de proyectos hace Samuel?',
  'Muéstrame sus trabajos de fotografía',
  '¿Cuál es su proyecto más reciente?',
];

interface ChatBotProps {
  projects: Project[];
}

function summarizeProjects(projects: Project[]) {
  return projects.map((p) => ({
    title: p.title,
    date: p.date,
    category: p.category,
    description: p.description,
    media: {
      fotos: p.media.filter((m) => m.type === 'foto').length,
      videos: p.media.filter((m) => m.type === 'video').length,
      pdfs: p.media.filter((m) => m.type === 'pdf').length,
    },
  }));
}

export default function ChatBot({ projects }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ projects: summarizeProjects(projectsRef.current) }),
      }),
    []
  );

  const { messages, sendMessage, status, stop, error, setMessages, clearError } = useChat({
    transport,
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    if (error) clearError();
    sendMessage({ text: trimmed });
    setInput('');
  };

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Asistente del portafolio"
          className="fixed z-30 inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px] h-[min(560px,calc(100dvh-7rem))] flex flex-col bg-neutral-950/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white select-text"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white text-black">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  className="text-sm font-medium tracking-tight truncate"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Asistente de Samuel
                </h2>
                <p className="text-[11px] text-white/50 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  Pregúntame sobre el portafolio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    setMessages([]);
                    clearError();
                  }}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Reiniciar conversación"
                  title="Reiniciar conversación"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar asistente"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4 my-auto">
                <p className="text-[15px] leading-relaxed text-white/80 text-pretty">
                  Hola, soy el asistente del portafolio. Puedo contarte sobre los proyectos, series
                  fotográficas y producciones multimedia de Samuel.
                </p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="text-left text-[13px] bg-white/5 hover:bg-white hover:text-black border border-white/15 rounded-full px-3.5 py-1.5 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const text = message.parts
                  .map((part) => (part.type === 'text' ? part.text : ''))
                  .join('');
                if (!text) return null;
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'self-end bg-white text-black rounded-2xl rounded-br-md px-3.5 py-2'
                        : 'self-start text-white/90'
                    }`}
                  >
                    <span className="sr-only">{isUser ? 'Tú: ' : 'Asistente: '}</span>
                    {text}
                  </div>
                );
              })
            )}

            {status === 'submitted' && (
              <div className="self-start flex gap-1 py-2" aria-label="El asistente está escribiendo">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="self-start text-[13px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                No pude responder en este momento. Inténtalo de nuevo.
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-white/10"
          >
            <div className="flex items-end gap-2 bg-white/5 border border-white/15 rounded-2xl pl-3.5 pr-1.5 py-1.5 focus-within:border-white/40 transition-colors">
              <label htmlFor="chatbot-input" className="sr-only">
                Escribe tu pregunta
              </label>
              <textarea
                id="chatbot-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Pregunta sobre los proyectos..."
                className="flex-1 resize-none bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none py-1.5 max-h-28"
              />
              {isBusy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/80 transition-colors cursor-pointer"
                  aria-label="Detener respuesta"
                >
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Enviar mensaje"
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed z-30 right-4 bottom-4 sm:right-6 sm:bottom-6 h-12 sm:h-14 pl-4 pr-5 flex items-center gap-2 rounded-full bg-white text-black shadow-2xl hover:bg-black hover:text-white border border-white/20 transition-colors cursor-pointer"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente del portafolio'}
        aria-expanded={open}
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
        )}
        <span className="text-[14px] sm:text-[15px]">{open ? 'Cerrar' : 'Pregúntame'}</span>
      </button>
    </>
  );
}
