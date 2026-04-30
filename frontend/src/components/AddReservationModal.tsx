import { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import api from '../services/api';

interface Table {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  customerName: string;
  mobile: string;
  guests: number;
  dateTime: string;
  status: string;
  tableId?: string;
  floor?: string;
  tableIds?: string[];
  isMerged?: boolean;
}

interface AddReservationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialFloor?: string;
  initialData?: Reservation | null;
}

export default function AddReservationModal({ onClose, onSuccess, initialFloor, initialData }: AddReservationModalProps) {
  const isEditing = !!initialData;
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [mobile, setMobile] = useState(initialData?.mobile || '');
  const [guests, setGuests] = useState(initialData?.guests || 2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [floor, setFloor] = useState(initialData?.floor || initialFloor || 'GROUND');
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>(initialData?.tableIds || (initialData?.tableId ? [initialData.tableId] : []));
  const [isMerged, setIsMerged] = useState(initialData?.isMerged || false);
  const [tables, setTables] = useState<Table[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialData?.dateTime) {
      const dt = new Date(initialData.dateTime);
      setDate(dt.toISOString().split('T')[0]);
      setTime(dt.toTimeString().split(' ')[0].substring(0, 5));
    }
  }, [initialData]);

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
      const payload = {
        customerName,
        mobile,
        guests: Number(guests),
        dateTime: `${date}T${time}:00`,
        floor,
        tableIds: selectedTableIds,
        isMerged,
      };

      if (isEditing) {
        await api.patch(`/reservations/${initialData!.id}`, payload);
      } else {
        await api.post('/reservations', payload);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save reservation:', err);
      alert('Failed to save reservation. Check if tables are available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !window.confirm('Are you sure you want to delete this reservation?')) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/reservations/${initialData.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      alert('Failed to delete reservation.');
    } finally {
      setIsDeleting(false);
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
            <h2 className="text-3xl font-black text-[#0c1424]">{isEditing ? 'Modify Booking' : 'Add Reservation'}</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">{isEditing ? 'Update reservation details' : 'Strict details required for booking'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full p-3 text-rose-500 hover:bg-rose-50 transition-colors"
                title="Delete Reservation"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-3 hover:bg-slate-100 transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
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
            disabled={isSubmitting || isDeleting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0c1424] py-5 text-sm font-black text-white shadow-xl hover:bg-black disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <Check size={20} strokeWidth={3} />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Booking' : 'Confirm Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
