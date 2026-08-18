import { Bot, Check, Copy, Loader2, MessageSquare, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface PdfChatModalProps {
    show: boolean;
    summary: string;
    filename: string;
    onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
    { emoji: '📖', text: 'What are the key takeaways from this document?' },
    { emoji: '💡', text: 'Can you explain the main argument simply?' },
    { emoji: '🎯', text: 'Who is the intended audience for this content?' },
    { emoji: '📋', text: 'What action items or conclusions are mentioned?' },
];

/** Three bouncing dots shown while the AI is responding */
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 px-1 py-1">
            {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot inline-block h-2 w-2 rounded-full bg-violet-400" />
            ))}
        </div>
    );
}

export default function PdfChatModal({ show, summary, filename, onClose }: PdfChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (show && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hello! 👋 I've read **"${filename || 'this document'}"**. Ask me anything about its contents!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        }
    }, [show, filename]);

    useEffect(() => {
        if (show) { setTimeout(() => inputRef.current?.focus(), 100); }
    }, [show]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Esc to close
    useEffect(() => {
        if (!show) { return; }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, onClose]);

    if (!show) { return null; }

    const handleSendMessage = async (textToSend?: string) => {
        const questionText = textToSend || input.trim();
        if (!questionText || loading) { return; }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: questionText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        if (!textToSend) { setInput(''); }
        setLoading(true);

        try {
            const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const historyPayload = updatedMessages
                .filter((m) => m.id !== 'welcome')
                .map((m) => ({ role: m.role, content: m.content }));

            const response = await fetch('/pdf/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token, Accept: 'application/json' },
                body: JSON.stringify({ question: questionText, context_summary: summary, history: historyPayload }),
            });

            const data = await response.json();

            if (response.ok && data.answer) {
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }]);
            } else {
                throw new Error(data.message || 'Failed to get response.');
            }
        } catch {
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '⚠️ Sorry, I could not process your question right now. Please try again.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyText = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch { /* ignore */ }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md">
            <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-3">
                        <div className={`relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 ${loading ? 'after:absolute after:inset-0 after:rounded-2xl after:animate-ping after:bg-violet-500/30' : ''}`}>
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white">Ask AI Assistant</h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/80 dark:text-violet-300">
                                    <Sparkles className="h-3 w-3" /> Q&A Mode
                                </span>
                            </div>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400 max-w-md">
                                Grounded in: <span className="font-medium text-slate-700 dark:text-slate-300">{filename || 'PDF Document'}</span>
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close modal">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="min-h-0 flex-1 overflow-y-auto space-y-4 bg-slate-50/50 p-4 sm:p-6 dark:bg-slate-900/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'}`}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>

                            {/* Bubble */}
                            <div className={`group relative max-w-[80%] space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none'
                                        : 'card-glass rounded-tl-none border border-slate-200/80 text-slate-800 dark:border-slate-700/60 dark:text-slate-100'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>

                                <div className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span>{msg.timestamp}</span>
                                    {msg.role === 'assistant' && (
                                        <button type="button" onClick={() => handleCopyText(msg.id, msg.content)}
                                            className="opacity-0 transition group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-200">
                                            {copiedId === msg.id
                                                ? <Check className="h-3 w-3 text-emerald-500 inline" />
                                                : <Copy className="h-3 w-3 inline" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="card-glass rounded-2xl rounded-tl-none border border-slate-200/80 px-4 py-3 shadow-sm dark:border-slate-700/60">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested questions (shown early in conversation) */}
                {messages.length <= 2 && !loading && (
                    <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/30">
                        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Suggested Questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                                <button key={idx} type="button" onClick={() => handleSendMessage(q.text)}
                                    className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-sm dark:border-violet-800/40 dark:bg-slate-800 dark:text-violet-300 dark:hover:bg-slate-700">
                                    <span>{q.emoji}</span>
                                    <span>{q.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input bar */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
                        disabled={loading}
                        className="flex-1 max-h-32 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 transition hover:from-violet-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50"
                        title="Send question"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
