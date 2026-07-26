import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DEMO_RESPONSES = {
  'backend': 'Veritabanında Backend Developer pozisyonundaki adaylar:\n\n1. **Ahmet Yılmaz** - ODTÜ, 4 yıl deneyim (Python, Java, FastAPI, Docker)\n2. **Mehmet Demir** - Hacettepe Üniversitesi, 5 yıl deneyim (Java, Spring Boot, AWS)\n3. **Seda Yıldız** - Boğaziçi Üniversitesi, 3 yıl deneyim (Python, Django, Flask)\n\nToplam 3 backend developer adayı bulunmaktadır.',
  'ingilizce': 'İngilizcesi B2 ve üstü olan adaylar:\n\n1. **Ayşe Çelik** - İngilizce C1\n2. **Elif Kaya** - İngilizce C1\n3. **Burak Şahin** - İngilizce C1\n4. **Seda Yıldız** - İngilizce C1\n5. **Ahmet Yılmaz** - İngilizce B2\n6. **Mehmet Demir** - İngilizce B2\n7. **Can Öztürk** - İngilizce B2\n8. **Emre Koç** - İngilizce B2\n\nToplam 8 aday B2 ve üstü İngilizce seviyesine sahiptir.',
  'python': 'Python bilen adaylar:\n\n1. **Ahmet Yılmaz** - Backend Developer (python, java, fastapi, docker...)\n2. **Mehmet Demir** - Backend Developer (java, spring boot, python, sql...)\n3. **Elif Kaya** - Data Engineer (python, sql, spark, kafka...)\n4. **Burak Şahin** - DevOps Engineer (docker, kubernetes, python, bash...)\n5. **Seda Yıldız** - Backend Developer (python, django, flask...)\n6. **Deniz Aktaş** - Bilgisayar Mühendisi (python, java, c++...)\n\nToplam 6 aday Python yetkinliğine sahiptir.',
  'deneyim': 'En deneyimli adaylar (yıl bazında):\n\n1. **Burak Şahin** - 6 yıl (DevOps Engineer)\n2. **Mehmet Demir** - 5 yıl (Backend Developer)\n3. **Ahmet Yılmaz** - 4 yıl (Backend Developer)\n4. **Elif Kaya** - 4 yıl (Data Engineer)\n5. **Ayşe Çelik** - 3 yıl (Frontend Developer)\n\nOrtalama deneyim: 3.3 yıl',
  'toplam': 'Veritabanında toplam **10** aday bulunmaktadır.\n\n- ✅ Onaylanan: 4\n- ⏳ Beklemede: 5\n- ❌ Reddedilen: 1\n\nMeslek dağılımı:\n- Backend Developer: 3\n- Frontend Developer: 2\n- DevOps Engineer: 1\n- Data Engineer: 1\n- Full Stack Developer: 1\n- Mobile Developer: 1\n- Bilgisayar Mühendisi: 1',
};

function getResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('backend') || lower.includes('deneyimli')) return DEMO_RESPONSES['backend'];
  if (lower.includes('ingilizce') || lower.includes('dil') || lower.includes('b2')) return DEMO_RESPONSES['ingilizce'];
  if (lower.includes('python') || lower.includes('java') || lower.includes('skill')) return DEMO_RESPONSES['python'];
  if (lower.includes('deneyim') || lower.includes('tecrübe') || lower.includes('yıl')) return DEMO_RESPONSES['deneyim'];
  if (lower.includes('toplam') || lower.includes('kaç') || lower.includes('istatistik') || lower.includes('sayı')) return DEMO_RESPONSES['toplam'];
  return `"${message}" sorgunuz analiz edildi.\n\nDemo modda sınırlı sayıda sorgu desteklenmektedir. Şu soruları deneyebilirsiniz:\n\n- "Backend konusunda en deneyimli adaylar kimler?"\n- "İngilizcesi B2 ve üstü olanları listele"\n- "Python bilen adaylar"\n- "Toplam kaç aday var?"\n- "En deneyimli adaylar"\n\nGerçek API anahtarı eklendiğinde tüm doğal dil sorguları desteklenecektir.`;
}

export default function ChatAssistant() {
  const { chatMessages, addChatMessage } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(userMsg.content);
      addChatMessage({ role: 'assistant', content: response, timestamp: new Date().toISOString() });
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'Backend konusunda en deneyimli 5 aday kim?',
    'İngilizcesi B2 ve üstü olanları listele',
    'Python bilen adaylar',
    'Toplam kaç aday var?',
  ];

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">İK Asistanı</h1>
        <p className="text-gray-500 mt-1">Doğal dil ile veritabanını sorgulayın</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 antigravity-card-static flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Merhaba! Ben İK Asistanınız 👋</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Doğal dil ile veritabanını sorgulayabilirsiniz. Aday bilgilerini, yetkinlikleri ve istatistikleri sorabilirsiniz.
              </p>

              {/* Suggestions */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-br-md'
                    : 'bg-surface-50 text-gray-700 border border-surface-200 rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-surface-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-start chat-message">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-surface-50 p-4 rounded-2xl rounded-bl-md border border-surface-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-surface-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sorunuzu yazın... (Örn: Backend konusunda en deneyimli 5 aday kim?)"
              className="antigravity-input flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="antigravity-button px-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
