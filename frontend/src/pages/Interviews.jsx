import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, X, Check, Calendar, Clock, GripVertical, ChevronDown, User, Briefcase, StickyNote,
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
    transform: CSS.Transform.toString(transform),
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
      className="antigravity-card p-4 space-y-2 mb-3 cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <button {...attributes} {...listeners} className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
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

export default function Interviews() {
  const { interviews, candidates, addInterview, updateInterview, moveInterview, deleteInterview } = useStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newInterview, setNewInterview] = useState({
    candidate_id: '', candidate_name: '', position: '', interview_date: '', interview_time: '', notes: ''
  });

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

      {/* New Interview Form */}
      {showNewForm && (
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
      <DndContext
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
      </DndContext>
    </div>
  );
}
