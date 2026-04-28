import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../services/api';

interface AddTableModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTableModal({ onClose, onSuccess }: AddTableModalProps) {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(4);
  const [floor, setFloor] = useState('GROUND');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/tables', {
        name,
        seats: Number(seats),
        floor,
        sortOrder: 0
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create table:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c1424]/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#0c1424]">Add New Table</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Table Name / ID</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. T110"
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] focus:ring-4 focus:ring-[#5dc7ec]/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Seats</label>
              <input
                type="number"
                required
                min="1"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] focus:ring-4 focus:ring-[#5dc7ec]/10 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Floor</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all appearance-none"
              >
                <option value="GROUND">Ground Floor</option>
                <option value="TERRACE">Terrace</option>
                <option value="BAR">Bar</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0c1424] py-4 text-sm font-black text-white shadow-xl hover:bg-black disabled:opacity-50 transition-all"
          >
            <Check size={20} strokeWidth={3} />
            {isSubmitting ? 'Adding...' : 'Create Table'}
          </button>
        </form>
      </div>
    </div>
  );
}
