import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

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
};

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const copy: Record<Language, Copy> = {
  en: {
    assistant: "AI calling assistant",
    newChat: "New chat",
    eyebrow: "YOUR CALLING COPILOT",
    title: "Every conversation,",
    titleAccent: "made smarter.",
    intro: "Prepare calls, improve your message, and follow up with confidence. How can I help?",
    starters: ["Prepare a customer call", "Write a follow-up message", "Create a sales call script"],
    placeholder: "Ask about your next call...",
    send: "Send message",
    thinking: "Assistant is thinking",
    unavailable: "The assistant is unavailable right now.",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    assistant: "Assistant d’appels IA",
    newChat: "Nouvelle discussion",
    eyebrow: "VOTRE COPILOTE D’APPELS",
    title: "Chaque conversation,",
    titleAccent: "plus intelligente.",
    intro: "Préparez vos appels, améliorez votre message et relancez en toute confiance. Comment puis-je vous aider ?",
    starters: ["Préparer un appel client", "Rédiger un message de suivi", "Créer un script d’appel commercial"],
    placeholder: "Posez une question sur votre prochain appel...",
    send: "Envoyer le message",
    thinking: "L’assistant réfléchit",
    unavailable: "L’assistant est indisponible pour le moment.",
    error: "Une erreur s’est produite. Veuillez réessayer.",
  },
  ar: {
    assistant: "مساعد المكالمات الذكي",
    newChat: "محادثة جديدة",
    eyebrow: "مساعدك الذكي للمكالمات",
    title: "كل محادثة،",
    titleAccent: "أكثر ذكاءً.",
    intro: "حضّر مكالماتك، وحسّن رسالتك، وتابع بثقة. كيف يمكنني مساعدتك؟",
    starters: ["تحضير مكالمة مع عميل", "كتابة رسالة متابعة", "إنشاء نص لمكالمة مبيعات"],
    placeholder: "اسأل عن مكالمتك القادمة...",
    send: "إرسال الرسالة",
    thinking: "المساعد يفكر",
    unavailable: "المساعد غير متاح حالياً.",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
};

function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 3.8-9L3 3Zm4.7 10.2-1.8 4.3 10.4-5.2H7.8a1 1 0 0 1-.1.9Zm8.6-1.5L5.9 6.5l1.8 4.3a1 1 0 0 1 .1.9h8.5Z" /></svg>;
}

function QuestionIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-5.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm.15-8.25c-2.1 0-3.55 1.24-3.65 3.18h2c.08-.84.7-1.38 1.62-1.38.88 0 1.48.49 1.48 1.2 0 .58-.32.94-1.16 1.43-1.08.64-1.47 1.25-1.42 2.42h1.84c0-.67.2-.94 1.03-1.45 1.13-.68 1.71-1.53 1.71-2.58 0-1.68-1.4-2.82-3.45-2.82Z" /></svg>;
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
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("vr-language", language);
  }, [language]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

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
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t.unavailable);
      setMessages((current) => [...current, { role: "assistant", content: data.message }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) { event.preventDefault(); void sendMessage(input); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); }
  }

  return (
    <main className="app-shell">
      <section className="chat-card" aria-label="VR Digital Calling">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark"><img src="/vr-logo.png" alt="" /></div>
            <div><h1>VR Digital <span>Calling</span></h1><p>{t.assistant}</p></div>
          </div>
          <div className="topbar-actions">
            <label className="language-select">
              <span className="sr-only">Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Language">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </label>
            {messages.length > 0 && <button className="new-chat" type="button" onClick={() => { setMessages([]); setError(""); }}>{t.newChat}</button>}
          </div>
        </header>

        <div className="conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon"><QuestionIcon /></div>
              <span className="eyebrow">{t.eyebrow}</span>
              <h2>{t.title}<br /><strong>{t.titleAccent}</strong></h2>
              <p>{t.intro}</p>
              <div className="suggestions">
                {t.starters.map((starter) => <button key={starter} onClick={() => void sendMessage(starter)}>{starter}</button>)}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "assistant" && <div className="avatar"><img src="/vr-logo.png" alt="VR" /></div>}
                  <div className="bubble">{message.content}</div>
                </div>
              ))}
              {loading && <div className="message-row assistant"><div className="avatar"><img src="/vr-logo.png" alt="VR" /></div><div className="bubble typing" aria-label={t.thinking}><span /><span /><span /></div></div>}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <p className="error" role="alert">{error}</p>}
          <form className="composer" onSubmit={handleSubmit}>
            <textarea aria-label={t.placeholder} placeholder={t.placeholder} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} rows={1} maxLength={2000} disabled={loading} />
            <button type="submit" className="send-button" aria-label={t.send} disabled={!input.trim() || loading}><SendIcon /></button>
          </form>
        </div>
      </section>
    </main>
  );
}
