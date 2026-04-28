import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../services/api';

interface Table {
  id: string;
  name: string;
}

interface AddReservationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialFloor?: string;
}

export default function AddReservationModal({ onClose, onSuccess, initialFloor }: AddReservationModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [floor, setFloor] = useState(initialFloor || 'GROUND');
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [isMerged, setIsMerged] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const response = await api.get(`/tables?status=AVAILABLE&floor=${floor}`);
        setTables(response.data);
      } catch (err) {
        console.error('Failed to load tables:', err);
      }
    };
    void loadTables();
  }, [floor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobile || !date || !time || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/reservations', {
        customerName,
        mobile,
        guests: Number(guests),
        dateTime: `${date}T${time}:00`,
        floor,
        tableIds: selectedTableIds,
        isMerged,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create reservation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTableToggle = (id: string) => {
    if (isMerged) {
      setSelectedTableIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedTableIds([id]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c1424]/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-[40px] bg-white p-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-[#0c1424]">Add Reservation</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Strict details required for booking</p>
          </div>
          <button onClick={onClose} className="rounded-full p-3 hover:bg-slate-100 transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 0400000000"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Guests</label>
              <input
                type="number"
                required
                min="1"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-[15px] font-bold text-[#0c1424] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-[13px] font-bold text-[#0c1424] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-[13px] font-bold text-[#0c1424] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Floor Selection</label>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="merge-opt"
                  checked={isMerged}
                  onChange={(e) => { setIsMerged(e.target.checked); setSelectedTableIds([]); }}
                  className="h-4 w-4 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
                />
                <label htmlFor="merge-opt" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Merge Option</label>
              </div>
            </div>

            <div className="flex gap-2">
              {['GROUND', 'TERRACE', 'BAR'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { setFloor(f); setSelectedTableIds([]); }}
                  className={`flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase transition-all ${
                    floor === f ? 'bg-[#0c1424] text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Table Selection {isMerged ? '(Multi-select)' : '(Optional)'}
            </label>
            <div className="grid grid-cols-3 gap-3 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
              {tables.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTableToggle(t.id)}
                  className={`rounded-xl border-2 p-3 text-center transition-all ${
                    selectedTableIds.includes(t.id) 
                      ? 'border-[#5dc7ec] bg-[#5dc7ec]/5 text-[#0c1424]' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className="text-[14px] font-black">{t.name}</div>
                </button>
              ))}
              {tables.length === 0 && (
                <div className="col-span-3 py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  No tables available
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0c1424] py-5 text-sm font-black text-white shadow-xl hover:bg-black disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <Check size={20} strokeWidth={3} />
            {isSubmitting ? 'Booking...' : 'Confirm Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
