import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, RefreshCw, Upload, X } from 'lucide-react';
import { api } from '../api/api';
import { useStore } from '../store/useStore';

const MAX_FILES = 20;

function makeEntry(file, index) {
  return { id: `${file.name}-${file.size}-${file.lastModified}-${index}`, file, name: file.name, status: 'waiting', progress: 0, error: '', candidate: null };
}

export default function BatchCandidateUploader({ jobId = null, onComplete }) {
  const inputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchError, setBatchError] = useState('');
  const addCandidate = useStore(state => state.addCandidate);
  const updateCandidate = useStore(state => state.updateCandidate);

  const updateEntry = (id, patch) => setEntries(current => current.map(entry => entry.id === id ? { ...entry, ...patch } : entry));

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    setBatchError('');
    setEntries(current => {
      const known = new Set(current.map(entry => `${entry.file.name}-${entry.file.size}-${entry.file.lastModified}`));
      const available = Math.max(0, MAX_FILES - current.length);
      const additions = incoming.filter(file => !known.has(`${file.name}-${file.size}-${file.lastModified}`)).slice(0, available).map((file, index) => makeEntry(file, current.length + index));
      if (incoming.length > additions.length && available === 0) setBatchError(`Bir partide en fazla ${MAX_FILES} PDF işlenebilir.`);
      return [...current, ...additions];
    });
  };

  const processEntry = async (entry) => {
    updateEntry(entry.id, { status: 'uploading', progress: 2, error: '' });
    try {
      const analyzed = await api.uploadCV(entry.file, progress => updateEntry(entry.id, { status: progress >= 100 ? 'analyzing' : 'uploading', progress }));
      updateEntry(entry.id, { status: 'saving', progress: 100 });
      const saved = await api.saveCandidate(analyzed);
      if (saved.save_action === 'updated') updateCandidate(saved.id, saved);
      else addCandidate(saved);
      updateEntry(entry.id, { status: 'completed', candidate: saved, error: '' });
      return saved;
    } catch (error) {
      updateEntry(entry.id, { status: 'failed', error: error.message || 'Dosya işlenemedi.' });
      return null;
    }
  };

  const runBatch = async () => {
    const queue = entries.filter(entry => entry.status === 'waiting' || entry.status === 'failed');
    if (!queue.length || processing) return;
    setProcessing(true);
    setBatchError('');
    const savedCandidates = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const item = queue[cursor];
        cursor += 1;
        const saved = await processEntry(item);
        if (saved) savedCandidates.push(saved);
      }
    };
    await Promise.all([worker(), worker()]);
    let matchResponse = null;
    if (jobId && savedCandidates.length) {
      try {
        matchResponse = await api.matchJobCandidates(jobId, savedCandidates.map(candidate => candidate.id));
      } catch (error) {
        setBatchError(error.message || 'CV’ler kaydedildi ancak ilan eşleştirmesi tamamlanamadı.');
      }
    }
    setProcessing(false);
    onComplete?.({ savedCandidates, matchResponse });
  };

  const completed = entries.filter(entry => entry.status === 'completed').length;
  const failed = entries.filter(entry => entry.status === 'failed').length;

  return (
    <section className="space-y-4">
      <div className={`batch-upload-zone ${dragActive ? 'batch-upload-zone-active' : ''}`} onDragEnter={event => { event.preventDefault(); setDragActive(true); }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={event => { event.preventDefault(); setDragActive(false); addFiles(event.dataTransfer.files); }}>
        <Upload className="h-8 w-8 text-primary-500" />
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900">Toplu CV PDF yükle</h3>
          <p className="mt-1 text-sm text-gray-500">En fazla 20 PDF seçin. Dosyalar ikişer ikişer analiz edilip veritabanına kaydedilir.</p>
        </div>
        <button type="button" className="ml-auto rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100" onClick={() => inputRef.current?.click()} disabled={processing}>Dosya seç</button>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
      </div>

      {batchError && <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-600"><AlertCircle size={17} />{batchError}</div>}

      {entries.length > 0 && <div className="antigravity-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
          <div><p className="font-semibold text-gray-900">İşlem kuyruğu</p><p className="mt-0.5 text-xs text-gray-500">{entries.length} dosya · {completed} tamamlandı{failed ? ` · ${failed} hata` : ''}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg p-2 text-gray-400 hover:bg-surface-100 hover:text-danger-500" title="Listeyi temizle" onClick={() => setEntries([])} disabled={processing}><X size={18} /></button>
            <button type="button" className="antigravity-button flex min-w-[190px] items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50" onClick={runBatch} disabled={processing || entries.every(entry => entry.status === 'completed')}>
              {processing ? <LoaderCircle size={17} className="animate-spin" /> : failed ? <RefreshCw size={17} /> : <Upload size={17} />}
              {processing ? 'CV’ler işleniyor' : failed ? 'Hatalıları yeniden dene' : jobId ? 'Yükle ve eşleştir' : 'Analiz et ve kaydet'}
            </button>
          </div>
        </div>
        <div className="divide-y divide-surface-100">{entries.map(entry => <div key={entry.id} className="grid grid-cols-[minmax(0,1fr)_170px_32px] items-center gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3"><FileText size={18} className="shrink-0 text-primary-500" /><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800" title={entry.name}>{entry.name}</p>{entry.error && <p className="mt-0.5 truncate text-xs text-danger-600" title={entry.error}>{entry.error}</p>}</div></div>
          <div><div className="mb-1 flex justify-between text-xs text-gray-500"><span>{({ waiting: 'Hazır', uploading: 'Yükleniyor', analyzing: 'OCR + AI analizi', saving: 'Kaydediliyor', completed: entry.candidate?.save_action === 'updated' ? 'Kayıt güncellendi' : 'Kaydedildi', failed: 'Başarısız' })[entry.status]}</span><span>{entry.status === 'completed' ? '%100' : entry.status === 'waiting' || entry.status === 'failed' ? '' : `%${entry.progress}`}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-100"><div className={`h-full rounded-full transition-all duration-300 ${entry.status === 'failed' ? 'bg-danger-500' : entry.status === 'completed' ? 'bg-success-500' : 'bg-primary-500'}`} style={{ width: entry.status === 'failed' ? '100%' : `${entry.progress}%` }} /></div></div>
          {entry.status === 'completed' ? <CheckCircle2 size={19} className="text-success-500" /> : entry.status === 'failed' ? <AlertCircle size={19} className="text-danger-500" /> : entry.status !== 'waiting' ? <LoaderCircle size={18} className="animate-spin text-primary-500" /> : null}
        </div>)}</div>
      </div>}
    </section>
  );
}
