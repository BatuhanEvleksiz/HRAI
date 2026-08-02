import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/api';
import { useStore } from '../store/useStore';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, X, Check, Calendar, Clock, GripVertical, User, Briefcase, StickyNote, Mic, Square,
  Upload, FileAudio, Sparkles, Save, Loader2, MessageSquareText, Search,
} from 'lucide-react';

function capitalize(str) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const columnConfig = {
  pending: { title: 'Onay Bekleyenler', color: 'border-warning-300', bg: 'bg-warning-50/30', dotColor: 'bg-warning-400' },
  approved: { title: 'Onaylananlar', color: 'border-success-300', bg: 'bg-success-50/30', dotColor: 'bg-success-400' },
  rejected: { title: 'Reddedilenler', color: 'border-danger-300', bg: 'bg-danger-50/30', dotColor: 'bg-danger-400' },
};

function InterviewCard({ interview, onToggleComplete, onDelete, onAddNote }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: interview.id });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const style = {
    transform: isDragging
      ? `${CSS.Transform.toString(transform) || ''} rotate(1deg) scale(1.02)`
      : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveNote = () => {
    if (noteText.trim()) {
      onAddNote(interview.id, noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`antigravity-card kanban-card p-4 space-y-2 mb-3 ${isDragging ? 'kanban-card--dragging' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <button {...attributes} {...listeners} className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing" aria-label="Mülakat kartını sürükle">
            <GripVertical className="w-4 h-4" />
          </button>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{capitalize(interview.candidate_name)}</h4>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {capitalize(interview.position)}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggleComplete(interview.id, true)}
            className={`p-1 rounded-lg transition-colors ${interview.is_completed === true ? 'bg-success-100 text-success-600' : 'text-gray-300 hover:text-success-500 hover:bg-success-50'}`}
            title="Gerçekleşti"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleComplete(interview.id, false)}
            className={`p-1 rounded-lg transition-colors ${interview.is_completed === false ? 'bg-danger-100 text-danger-600' : 'text-gray-300 hover:text-danger-500 hover:bg-danger-50'}`}
            title="Gerçekleşmedi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Calendar className="w-3 h-3" />
        <span>{interview.interview_date}</span>
        <span>-</span>
        <span>{interview.interview_time}</span>
      </div>

      {interview.is_completed === true && (
        <span className="text-xs font-semibold text-success-500">Gerçekleşti</span>
      )}
      {interview.is_completed === false && (
        <span className="text-xs font-semibold text-danger-500">Gerçekleşmedi</span>
      )}

      {interview.notes && (
        <p className="text-xs text-gray-500 italic bg-surface-50 p-2 rounded-lg">{interview.notes}</p>
      )}

      {!showNoteInput ? (
        <button
          onClick={() => setShowNoteInput(true)}
          className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <StickyNote className="w-3 h-3" /> + Not ekle
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
            placeholder="Not yazın..."
            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-surface-50 border border-surface-200 outline-none focus:border-primary-300"
            autoFocus
          />
          <button onClick={handleSaveNote} className="text-xs px-2 py-1.5 rounded-lg bg-primary-500 text-white">
            Kaydet
          </button>
          <button onClick={() => setShowNoteInput(false)} className="text-xs text-gray-400">
            İptal
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ status, interviews, onToggleComplete, onDelete, onAddNote }) {
  const config = columnConfig[status];
  const items = interviews.filter(i => i.status === status);

  return (
    <div className={`kanban-column ${config.color} ${config.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
          <h3 className="font-bold text-gray-800 text-sm">{config.title}</h3>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-white/60 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(interview => (
          <InterviewCard
            key={interview.id}
            interview={interview}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onAddNote={onAddNote}
          />
        ))}
      </SortableContext>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-300 text-sm">
          Sürükle bırak ile aday ekleyin
        </div>
      )}
    </div>
  );
}

const DEMO_TRANSCRIPT = `İK: Bize son projenizden ve bu projedeki sorumluluğunuzdan bahseder misiniz?
Aday: Son projemde Python ve FastAPI kullanarak bir e-ticaret servisi geliştirdim. Takım içinde API tasarımından ve test süreçlerinden sorumluydum.
İK: Zorlandığınız bir problemi nasıl çözdünüz?
Aday: Trafik arttığında performans sorunu yaşadık. Logları inceleyip önbellekleme ve veritabanı indeksleri ekledim. Sonuçta yanıt süresini düşürdük.`;

function parseSpeakerSegments(text) {
  return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const match = line.match(/^\[(INTERVIEWER|CANDIDATE|SPEAKER\s*\d+)\]\s*:?[\s-]*(.*)$/i);
    if (!match) return { speaker: 'unknown', text: line };
    return { speaker: match[1].toLowerCase().replace(/\s+/g, '_'), text: match[2].trim() };
  }).filter(segment => segment.text);
}

function speakerLabel(speaker) {
  if (speaker === 'interviewer') return 'İK';
  if (speaker === 'candidate') return 'Aday';
  return 'Konuşmacı';
}

function InterviewAssistant({ interviews, candidates }) {
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [interviewSearch, setInterviewSearch] = useState('');
  const [isInterviewPickerOpen, setIsInterviewPickerOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [speakerSegments, setSpeakerSegments] = useState([]);
  const [communicationSignals, setCommunicationSignals] = useState({});
  const [analysisMode, setAnalysisMode] = useState('demo');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);

  const selectedInterview = interviews.find(item => item.id === selectedInterviewId);
  const selectedCandidate = candidates.find(item => item.id === selectedInterview?.candidate_id);
  const matchingInterviews = [...interviews]
    .filter(item => {
      const query = interviewSearch.trim().toLocaleLowerCase('tr-TR');
      return !query || `${item.candidate_name || ''} ${item.position || ''} ${item.interview_date || ''}`.toLocaleLowerCase('tr-TR').includes(query);
    })
    .sort((a, b) => {
      const query = interviewSearch.trim().toLocaleLowerCase('tr-TR');
      const aStarts = (a.candidate_name || '').toLocaleLowerCase('tr-TR').startsWith(query) ? 1 : 0;
      const bStarts = (b.candidate_name || '').toLocaleLowerCase('tr-TR').startsWith(query) ? 1 : 0;
      return bStarts - aStarts;
    });

  const selectInterview = (interview) => {
    setSelectedInterviewId(interview.id);
    setInterviewSearch(interview.candidate_name || '');
    setIsInterviewPickerOpen(false);
  };

  const startLiveInterview = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Bu tarayıcı canlı konuşma tanımayı desteklemiyor. Chrome kullanabilir veya ses dosyası yükleyebilirsiniz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript + ' ';
      setTranscript(text.trim());
    };
    recognition.onerror = () => setMessage('Mikrofon konuşmayı algılayamadı. İzinleri kontrol edip tekrar deneyin.');
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setMessage('Canlı konuşma dinleniyor. Görüşme bitince kaydı durdurun.');
    setIsRecording(true);
  };

  const stopLiveInterview = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setMessage('Konuşma metne aktarıldı. Şimdi analiz modunu seçebilirsiniz.');
  };

  const uploadAudioFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    setAudioFile(file);
    setMessage('Ses dosyası yükleniyor. Ses kalıcı olarak saklanmaz.');
    try {
      const result = await api.transcribeInterviewAudio(file, setUploadProgress);
      setTranscript(result.transcript || '');
      setSpeakerSegments(parseSpeakerSegments(result.transcript || ''));
      setMessage('Ses metne dönüştürüldü. Artık analiz modunu seçebilirsiniz.');
    } catch (error) {
      setUploadProgress(0);
      setMessage(error.message || 'Ses dosyası işlenemedi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = (event) => {
    uploadAudioFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    uploadAudioFile(event.dataTransfer.files?.[0]);
  };

  const analyze = async (mode) => {
    if (mode === 'llm' && !transcript.trim() && !audioFile) {
      setMessage('Önce canlı kayıt başlatın veya bir ses dosyası yükleyin.');
      return;
    }
    const currentTranscript = transcript.trim();
    const source = mode === 'demo' ? (currentTranscript || DEMO_TRANSCRIPT) : currentTranscript;
    setTranscript(source);
    setAnalysisMode(mode);
    setIsProcessing(true);
    setMessage(mode === 'llm' ? 'LLM özeti ve değerlendirmesi hazırlanıyor...' : 'Demo analiz hazırlanıyor...');
    try {
      const result = mode === 'llm' && !currentTranscript && audioFile
        ? await api.analyzeInterviewAudio(audioFile, {
          interview_id: selectedInterviewId,
          candidate_id: selectedInterview?.candidate_id,
          mode,
        })
        : await api.analyzeInterview({
          transcript: source,
          interview_id: selectedInterviewId || null,
          candidate_id: selectedInterview?.candidate_id || null,
          mode,
        });
      setSummary(result.summary || '');
      setEvaluation(result.general_evaluation || '');
      setTranscript(result.transcript || source);
      setSpeakerSegments(result.speaker_segments?.length ? result.speaker_segments : parseSpeakerSegments(result.transcript || source));
      setCommunicationSignals(result.communication_signals || {});
      setMessage(result.warning || `${mode === 'llm' ? 'LLM' : 'Demo'} analizi hazır.`);
    } catch (error) {
      setMessage(error.message || 'Analiz yapılamadı.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAnalysis = async () => {
    if (!selectedInterview?.candidate_id) {
      setMessage('Kaydetmek için önce randevulu bir mülakat seçin.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.saveInterviewAnalysis({
        interview_id: selectedInterview.id,
        candidate_id: selectedInterview.candidate_id,
        transcript,
        summary,
        general_evaluation: evaluation,
        analysis_mode: analysisMode,
        speaker_segments: speakerSegments,
        communication_signals: communicationSignals,
      });
      setMessage('Mülakat kaydı adaya bağlandı ve kaydedildi.');
    } catch (error) {
      setMessage(error.message || 'Mülakat kaydedilemedi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="antigravity-card-static relative z-50 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-primary-500" />
              <h2 className="text-xl font-bold text-gray-900">Mülakat Asistanı</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Konuşmayı metne dönüştürün, yalnızca istediğiniz analiz için LLM kullanın.</p>
          </div>
          <div className="min-w-[240px] relative z-40">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Randevulu mülakat</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={interviewSearch} onFocus={() => setIsInterviewPickerOpen(true)} onChange={event => { setInterviewSearch(event.target.value); setIsInterviewPickerOpen(true); }} placeholder="İsim ara ve mülakat seç..." className="antigravity-select pl-10" aria-label="Mülakat adayı ara" />
            </div>
            {isInterviewPickerOpen && <div className="absolute left-0 right-0 top-[62px] z-[60] max-h-64 overflow-y-auto rounded-xl border border-surface-200 bg-white shadow-xl">
              {matchingInterviews.length ? matchingInterviews.map(item => <button key={item.id} type="button" onClick={() => selectInterview(item)} className={`w-full px-3 py-2.5 text-left hover:bg-primary-50 ${item.id === selectedInterviewId ? 'bg-primary-50' : ''}`}><span className="block text-sm font-semibold text-gray-800">{capitalize(item.candidate_name)}</span><span className="block text-xs text-gray-500">{capitalize(item.position)} · {item.interview_date} {item.interview_time}</span></button>) : <p className="px-3 py-4 text-xs text-gray-400">Eşleşen mülakat bulunamadı.</p>}
            </div>}
            {false && <select value={selectedInterviewId} onChange={e => setSelectedInterviewId(e.target.value)} className="antigravity-select">
              <option value="">Mülakat seçin...</option>
              {interviews.map(item => <option key={item.id} value={item.id}>{capitalize(item.candidate_name)} - {item.interview_date}</option>)}
            </select>
            }
          </div>
        </div>
        {selectedCandidate && <p className="text-xs text-primary-600 mt-3">Kayıt adaya bağlanacak: {capitalize(selectedCandidate.full_name)}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button type="button" onClick={isRecording ? stopLiveInterview : startLiveInterview} className={`antigravity-card-static p-5 text-left transition-colors ${isRecording ? 'border-danger-400 bg-danger-50/40' : 'hover:border-primary-300'}`}>
          {isRecording ? <Square className="w-6 h-6 text-danger-500 mb-3" /> : <Mic className="w-6 h-6 text-primary-500 mb-3" />}
          <span className="font-bold text-gray-900 block">{isRecording ? 'Canlı mülakatı durdur' : 'Canlı mülakat başlat'}</span>
          <span className="text-xs text-gray-500">Tarayıcı mikrofonundan Türkçe konuşmayı metne aktarır.</span>
        </button>
        <div
          onDragEnter={(event) => { event.preventDefault(); setIsDragActive(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          className={`antigravity-card-static p-5 transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50/60' : 'hover:border-primary-300'}`}
        >
          <Upload className="w-6 h-6 text-primary-500 mb-3" />
          <span className="font-bold text-gray-900 block">Kayıtlı ses dosyası yükle</span>
          <span className="text-xs text-gray-500 block mt-1">Dosyayı buraya sürükleyin veya bilgisayardan seçin.</span>
          <label className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Dosya seç
            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" disabled={isUploading || isProcessing} />
          </label>
          {uploadedFileName && <p className="text-xs text-gray-600 mt-3 truncate" title={uploadedFileName}>{uploadedFileName}</p>}
          {isUploading && <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500"><span>Yükleniyor...</span><span>%{uploadProgress}</span></div>
            <div className="h-2 rounded-full bg-surface-100 overflow-hidden"><div className="h-full rounded-full bg-primary-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} /></div>
          </div>}
          {!isUploading && uploadedFileName && uploadProgress === 100 && <p className="text-xs text-success-600 mt-2">Yükleme tamamlandı</p>}
          {!isUploading && uploadedFileName && !transcript.trim() && <p className="text-xs text-warning-600 mt-2">Ses dökümü henüz oluşmadı. HRAI ile analiz et düğmesi ses dosyasını doğrudan işleyecek.</p>}
        </div>
      </div>

      <div className="antigravity-card-static p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><FileAudio className="w-5 h-5 text-primary-500" /><h3 className="font-bold text-gray-900">Konuşmanın tamamı</h3></div>
          <span className="text-xs text-gray-400">Ses dosyası saklanmaz</span>
        </div>
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)} className="antigravity-input min-h-[180px] resize-y" placeholder="Canlı kayıt veya ses dosyası sonrası konuşma burada görünür..." />
        {speakerSegments.length > 0 && <div className="space-y-2 rounded-xl border border-surface-200 bg-surface-50/70 p-3">
          <div className="text-xs font-semibold text-gray-500">Konuşmacı ayrıştırması</div>
          {speakerSegments.map((segment, index) => <div key={`${segment.speaker}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${segment.speaker === 'interviewer' ? 'bg-primary-100 text-primary-700' : segment.speaker === 'candidate' ? 'bg-accent-100 text-accent-700' : 'bg-surface-200 text-gray-600'}`}>{speakerLabel(segment.speaker)}</span>
            <span className="leading-relaxed">{segment.text}</span>
          </div>)}
        </div>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => analyze('demo')} disabled={isProcessing || isUploading} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Demo analizi</button>
          <button type="button" onClick={() => analyze('llm')} disabled={isProcessing || isUploading} className="hrai-animated-button px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"><Sparkles className="w-4 h-4" /> HRAI ile analiz et</button>
          {isProcessing && <Loader2 className="w-5 h-5 text-primary-500 animate-spin self-center" />}
        </div>
      </div>

      {(summary || evaluation) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="antigravity-card-static p-5"><h3 className="font-bold text-gray-900 mb-2">Mülakat Özeti</h3><p className="text-sm text-gray-600 leading-relaxed">{summary}</p></div>
        <div className="antigravity-card-static p-5"><h3 className="font-bold text-gray-900 mb-2">Genel Değerlendirme</h3><p className="text-sm text-gray-600 leading-relaxed">{evaluation}</p></div>
      </div>}

      {analysisMode === 'llm' && Object.keys(communicationSignals).length > 0 && <div className="antigravity-card-static p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-bold text-gray-900">İletişim sinyalleri</h3>
          <span className="text-[11px] text-gray-400">LLM tahmini · tek başına karar kriteri değildir</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['expression_clarity', 'İfade netliği'], ['technical_depth', 'Teknik derinlik'], ['response_specificity', 'Yanıtların somutluğu'], ['overall_signal', 'Genel sinyal']].map(([key, label]) => <div key={key} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
            <div className="text-[11px] text-gray-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-primary-700">{communicationSignals[key] || 'Belirsiz'}</div>
          </div>)}
        </div>
        {Array.isArray(communicationSignals.evidence) && communicationSignals.evidence.length > 0 && <p className="mt-3 text-xs text-gray-500">Kanıt: {communicationSignals.evidence.join(' ')}</p>}
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">{message}</p>
        <button type="button" onClick={saveAnalysis} disabled={isProcessing || !summary || !evaluation} className="antigravity-button flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> Mülakat kaydını kaydet</button>
      </div>
    </div>
  );
}

export default function Interviews({ defaultTab = 'schedule' }) {
  const { interviews, candidates, addInterview, updateInterview, moveInterview, deleteInterview } = useStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [newInterview, setNewInterview] = useState({
    candidate_id: '', candidate_name: '', position: '', interview_date: '', interview_time: '', notes: ''
  });

  useEffect(() => {
    setActiveTab(defaultTab);
    if (defaultTab === 'assistant') setShowNewForm(false);
  }, [defaultTab]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Find which column the item was dropped in
    const activeInterview = interviews.find(i => i.id === active.id);
    if (!activeInterview) return;

    // Check if dropped over another item
    const overInterview = interviews.find(i => i.id === over.id);
    if (overInterview && overInterview.status !== activeInterview.status) {
      moveInterview(active.id, overInterview.status);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeInterview = interviews.find(i => i.id === active.id);
    const overInterview = interviews.find(i => i.id === over.id);

    if (overInterview && activeInterview && overInterview.status !== activeInterview.status) {
      moveInterview(active.id, overInterview.status);
    }
  };

  const handleToggleComplete = (id, completed) => {
    const interview = interviews.find(i => i.id === id);
    updateInterview(id, { is_completed: interview.is_completed === completed ? null : completed });
  };

  const handleAddNote = (id, notes) => {
    updateInterview(id, { notes });
  };

  const handleCreateInterview = () => {
    if (newInterview.candidate_name && newInterview.interview_date && newInterview.interview_time) {
      addInterview({
        ...newInterview,
        status: 'pending',
        is_completed: null,
      });
      setNewInterview({ candidate_id: '', candidate_name: '', position: '', interview_date: '', interview_time: '', notes: '' });
      setShowNewForm(false);
    }
  };

  const handleCandidateSelect = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setNewInterview({
        ...newInterview,
        candidate_id: candidateId,
        candidate_name: capitalize(candidate.full_name),
        position: capitalize(candidate.profession),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mülakatlar</h1>
          <p className="text-gray-500 mt-1">Kanban board ile mülakat yönetimi</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="antigravity-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Mülakat
        </button>
      </div>

      <div className="flex gap-2 border-b border-surface-200">
        <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'schedule' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>Mülakat Planı</button>
        <button onClick={() => setActiveTab('assistant')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${activeTab === 'assistant' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>Mülakat Asistanı</button>
      </div>

      {activeTab === 'assistant' && <InterviewAssistant interviews={interviews} candidates={candidates} />}

      {/* New Interview Form */}
      {activeTab === 'schedule' && showNewForm && (
        <div className="antigravity-card-static p-6 animate-slide-up space-y-4">
          <h3 className="font-bold text-gray-800">Yeni Mülakat Oluştur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Aday</label>
              <select
                value={newInterview.candidate_id}
                onChange={(e) => handleCandidateSelect(e.target.value)}
                className="antigravity-select"
              >
                <option value="">Aday seçin...</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{capitalize(c.full_name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Pozisyon</label>
              <input
                type="text"
                value={newInterview.position}
                onChange={(e) => setNewInterview({ ...newInterview, position: e.target.value })}
                className="antigravity-input"
                placeholder="Örn: Backend Developer"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Tarih</label>
              <input
                type="date"
                value={newInterview.interview_date}
                onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
                className="antigravity-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Saat</label>
              <input
                type="time"
                value={newInterview.interview_time}
                onChange={(e) => setNewInterview({ ...newInterview, interview_time: e.target.value })}
                className="antigravity-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Not (opsiyonel)</label>
              <input
                type="text"
                value={newInterview.notes}
                onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                className="antigravity-input"
                placeholder="Mülakat notu..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateInterview} className="antigravity-button">Oluştur</button>
            <button onClick={() => setShowNewForm(false)} className="px-5 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-surface-100">İptal</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {activeTab === 'schedule' && <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['pending', 'approved', 'rejected'].map(status => (
            <KanbanColumn
              key={status}
              status={status}
              interviews={interviews}
              onToggleComplete={handleToggleComplete}
              onDelete={deleteInterview}
              onAddNote={handleAddNote}
            />
          ))}
        </div>
      </DndContext>}
    </div>
  );
}
