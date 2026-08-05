import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  HiArrowUp,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string };
type Language = "en" | "fr" | "ar";

type Copy = {
  assistant: string;
  newChat: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  intro: string;
  starters: string[];
  placeholder: string;
  send: string;
  thinking: string;
  unavailable: string;
  error: string;
  language: string;
};

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const copy: Record<Language, Copy> = {
  en: {
    assistant: "AI calling assistant",
    newChat: "New conversation",
    eyebrow: "YOUR CALLING COPILOT",
    title: "What can I help",
    titleAccent: "you prepare?",
    intro: "Plan calls, sharpen your message, and write thoughtful follow-ups.",
    starters: ["Prepare a customer call", "Write a follow-up message", "Create a sales call script"],
    placeholder: "Message VR Digital Calling",
    send: "Send message",
    thinking: "Assistant is thinking",
    unavailable: "The assistant is unavailable right now.",
    error: "Something went wrong. Please try again.",
    language: "Language",
  },
  fr: {
    assistant: "Assistant d’appels IA",
    newChat: "Nouvelle conversation",
    eyebrow: "VOTRE COPILOTE D’APPELS",
    title: "Que puis-je vous aider",
    titleAccent: "à préparer ?",
    intro: "Planifiez vos appels, améliorez votre message et rédigez des suivis efficaces.",
    starters: ["Préparer un appel client", "Rédiger un message de suivi", "Créer un script d’appel commercial"],
    placeholder: "Écrire à VR Digital Calling",
    send: "Envoyer le message",
    thinking: "L’assistant réfléchit",
    unavailable: "L’assistant est indisponible pour le moment.",
    error: "Une erreur s’est produite. Veuillez réessayer.",
    language: "Langue",
  },
  ar: {
    assistant: "مساعد المكالمات الذكي",
    newChat: "محادثة جديدة",
    eyebrow: "مساعدك الذكي للمكالمات",
    title: "كيف يمكنني مساعدتك",
    titleAccent: "في التحضير؟",
    intro: "خطّط لمكالماتك، وحسّن رسالتك، واكتب متابعات فعّالة.",
    starters: ["تحضير مكالمة مع عميل", "كتابة رسالة متابعة", "إنشاء نص لمكالمة مبيعات"],
    placeholder: "اكتب إلى VR Digital Calling",
    send: "إرسال الرسالة",
    thinking: "المساعد يفكر",
    unavailable: "المساعد غير متاح حالياً.",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    language: "اللغة",
  },
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("vr-language");
    return saved === "fr" || saved === "ar" ? saved : "en";
  });
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("vr-language", language);
  }, [language]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
  }, [messages, loading]);

  function resetChat() {
    setMessages([]);
    setInput("");
    setError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, language }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || t.unavailable);
      }
      if (!response.body) throw new Error(t.unavailable);

      setMessages((current) => [...current, { role: "assistant", content: "" }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedContent += decoder.decode(value, { stream: true });
        const latest = streamedContent;
        setMessages((current) => {
          const updated = [...current];
          const last = updated.length - 1;
          if (last >= 0 && updated[last].role === "assistant") updated[last] = { role: "assistant", content: latest };
          return updated;
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const awaitingFirstToken = loading && messages[messages.length - 1]?.role === "user";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src="/vr-logo.png" alt="VR Digital Calling" /></div>
          <div><h1>VR Digital</h1><span>Calling</span></div>
        </div>

        <button className="new-chat" type="button" onClick={resetChat}>
          <HiOutlinePlus aria-hidden="true" />
          <span>{t.newChat}</span>
        </button>

        <div className="sidebar-current">
          <HiOutlineChatBubbleLeftRight aria-hidden="true" />
          <span>{t.assistant}</span>
        </div>

        <label className="language-select sidebar-language">
          <span>{t.language}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </label>
      </aside>

      <section className="chat-panel" aria-label="VR Digital Calling">
        <header className="topbar">
          <div className="mobile-brand">
            <img src="/vr-logo.png" alt="" />
            <span>VR Digital Calling</span>
          </div>
          <p>{t.assistant}</p>
          <label className="language-select topbar-language">
            <span className="sr-only">{t.language}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>
          </label>
        </header>

        <div className="conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon"><HiOutlineQuestionMarkCircle aria-hidden="true" /></div>
              <span className="eyebrow">{t.eyebrow}</span>
              <h2>{t.title}<br /><strong>{t.titleAccent}</strong></h2>
              <p>{t.intro}</p>
              <div className="suggestions">
                {t.starters.map((starter) => (
                  <button key={starter} type="button" onClick={() => void sendMessage(starter)}>{starter}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <article className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "assistant" && <div className="avatar"><img src="/vr-logo.png" alt="" /></div>}
                  <div className="bubble">
                    {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : message.content}
                    {message.role === "assistant" && loading && index === messages.length - 1 && <span className="stream-cursor" aria-hidden="true" />}
                  </div>
                </article>
              ))}
              {awaitingFirstToken && (
                <div className="message-row assistant">
                  <div className="avatar"><img src="/vr-logo.png" alt="" /></div>
                  <div className="typing" aria-label={t.thinking}><span /><span /><span /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer-area">
          <div className="composer-inner">
            {error && <p className="error" role="alert">{error}</p>}
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                aria-label={t.placeholder}
                placeholder={t.placeholder}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                disabled={loading}
              />
              <button type="submit" className="send-button" aria-label={t.send} disabled={!input.trim() || loading}>
                <HiArrowUp aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
