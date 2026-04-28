import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  ArrowUpFromLine, 
  Eraser, 
  PlusCircle,
  Search,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import AddTableModal from './components/AddTableModal';
import AddReservationModal from './components/AddReservationModal';
import { usePosCart } from './context/PosCartContext';
import { useAuth } from './context/AuthContext';

interface Table {
  id: string;
  name: string;
  seats: number;
  floor: 'GROUND' | 'TERRACE' | 'BAR';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLING' | 'MERGED';
  activeBillId?: string;
  currentOrderId?: string;
  startedAt?: string;
  currentTotal?: number;
  isKotSent?: boolean;
  customerName?: string;
}

interface Reservation {
  id: string;
  customerName: string;
  guests: number;
  dateTime: string;
  status: string;
  tableId?: string;
}

export default function POSTablesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBillSession } = usePosCart();
  const [tables, setTables] = useState<Table[]>([]);
  const [activeFloor, setActiveFloor] = useState<'GROUND' | 'TERRACE' | 'BAR'>('GROUND');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);


  const loadData = async () => {
    try {
      const [tablesRes, resRes] = await Promise.all([
        api.get('/tables'),
        api.get('/reservations/today')
      ]);
      setTables(tablesRes.data);
      setReservations(resRes.data);
    } catch (err) {
      console.error('Failed to load table data:', err);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables = useMemo(() => 
    tables.filter(t => t.floor === activeFloor), 
    [tables, activeFloor]
  );

  const handleSeatGuests = async () => {
    if (!selectedTable || selectedTable.status === 'OCCUPIED' || selectedTable.status === 'BILLING') return;
    try {
      // Create order session
      const bill = await createBillSession('DINE_IN', selectedTable.id, selectedTable.name);
      navigate(`/pos/order-entry?billId=${bill.id}`);
    } catch (err) {
      console.error('Failed to start table session:', err);
    }
  };

  const handleClearTable = async () => {
    if (!selectedTable) return;
    try {
      await api.post(`/tables/${selectedTable.id}/clear`);
      void loadData();
      setSelectedTable(null);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const getRunningTime = (startedAt?: string) => {
    if (!startedAt) return '';
    const start = new Date(startedAt).getTime();
    const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#f8fafc] font-sans overflow-y-auto custom-scrollbar min-h-0">
      {/* Top Header */}
      <header className="flex h-[90px] shrink-0 items-center justify-between border-b border-slate-100 bg-white px-10 sticky top-0 z-10">
        <div className="relative w-[350px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Search tables or orders..." 
            className="h-11 w-full rounded-2xl bg-slate-50/50 pl-14 pr-6 text-[13px] font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-slate-100/50"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMergeModal(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-[12px] font-black uppercase tracking-widest text-[#0c1424] transition-all hover:bg-slate-200 active:scale-95"
            >
              <ArrowUpFromLine size={16} />
              Merge Tables
            </button>
            <button 
              onClick={() => setShowAddResModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0c1424] px-5 py-2.5 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-black active:scale-95 shadow-lg shadow-black/10"
            >
              <PlusCircle size={16} />
              Add Reservation
            </button>
          </div>
          
          <div className="h-10 w-[1px] bg-slate-100 mx-2" />
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-black text-[#0c1424] leading-tight">{user?.fullName || 'Manager'}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">POS Terminal</div>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Manager" alt="Avatar" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-10 pt-8 pb-10">
        {/* Floor Toggles & Legend */}
        <div className="mb-8 flex items-center justify-between shrink-0">
          <div className="flex gap-2 rounded-[18px] bg-slate-200/40 p-1.5 border border-slate-200/20">
            {(['GROUND', 'TERRACE', 'BAR'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFloor(f)}
                className={`rounded-[14px] px-8 py-2.5 text-[12px] font-black tracking-tight transition-all uppercase ${
                  activeFloor === f
                    ? 'bg-white text-[#0c1424] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 pr-4">
            {[
              { label: 'Available', color: 'bg-emerald-500' },
              { label: 'Occupied', color: 'bg-[#0c1424]' },
              { label: 'Reserved', color: 'bg-amber-500' },
              { label: 'Billing', color: 'bg-sky-500' }
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
          {filteredTables.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`group relative flex min-h-[160px] flex-col rounded-[32px] border-2 p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                selectedTable?.id === table.id
                  ? 'border-[#5dc7ec] bg-white shadow-xl shadow-[#5dc7ec]/10'
                  : table.status === 'BILLING'
                    ? 'border-sky-400 bg-white shadow-sm'
                    : table.status === 'RESERVED'
                      ? 'border-transparent border-l-[4px] border-l-amber-500 bg-white shadow-sm'
                      : table.status === 'OCCUPIED'
                        ? 'border-transparent bg-[#0c1424] shadow-md'
                        : 'border-transparent bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className="mb-auto flex items-start justify-between">
                <div>
                  <h3 className={`text-[24px] font-black leading-none tracking-tight ${table.status === 'OCCUPIED' ? 'text-white' : 'text-[#0c1424]'}`}>
                    {table.name}
                  </h3>
                  <div className="mt-2 text-[12px] font-bold text-slate-400">
                    {table.seats} Seats
                  </div>
                </div>
                
                <div className="pt-0.5">
                  {table.status === 'OCCUPIED' ? (
                    <Users size={18} className="text-white/40" />
                  ) : table.status === 'BILLING' ? (
                    <div className="h-2 w-2 rounded-full bg-sky-500" />
                  ) : table.status === 'RESERVED' ? (
                    <Calendar className="text-amber-500" size={18} />
                  ) : (
                    <CheckCircle2 className="text-emerald-500" size={18} />
                  )}
                </div>
              </div>

              <div className="mt-6">
                {table.status === 'OCCUPIED' && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-white">
                    <Clock size={14} />
                    <span className="text-[13px] font-black tracking-tight">{getRunningTime(table.startedAt) || '0:00'}</span>
                  </div>
                )}
                {table.status === 'BILLING' && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-1.5 text-sky-600">
                    <span className="text-[10px] font-black uppercase tracking-widest">Billing</span>
                  </div>
                )}
                {table.status === 'RESERVED' && (
                  <div className="text-[12px] font-black text-[#0c1424] truncate">
                    {table.customerName || 'Reserved'}
                  </div>
                )}
              </div>
            </button>
          ))}

          <button 
            onClick={() => setShowAddTableModal(true)}
            className="flex min-h-[160px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 transition-all hover:border-[#5dc7ec] hover:text-[#5dc7ec] hover:bg-white/50"
          >
            <Plus size={24} />
            <span className="mt-2 text-[10px] font-black uppercase tracking-widest">Add Table</span>
          </button>
        </div>

        {/* Action Controls for Selected Table (Floating or Inline) */}
        {selectedTable && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-[28px] bg-[#0c1424] p-3 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="px-6 border-r border-white/10">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected</div>
              <div className="text-[18px] font-black text-white leading-tight">{selectedTable.name}</div>
            </div>
            
            <button 
              onClick={handleSeatGuests}
              disabled={selectedTable.status !== 'AVAILABLE' && selectedTable.status !== 'RESERVED'}
              className="flex h-12 items-center gap-2.5 rounded-2xl bg-white/10 px-6 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20 disabled:opacity-30"
            >
              <Users size={18} />
              Seat
            </button>
            
            <button 
              onClick={() => selectedTable.activeBillId && navigate(`/pos/order-entry?billId=${selectedTable.activeBillId}`)}
              disabled={!selectedTable.activeBillId}
              className="flex h-12 items-center gap-2.5 rounded-2xl bg-white/10 px-6 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20 disabled:opacity-30"
            >
              <FileText size={18} />
              Order
            </button>

            <button 
              onClick={handleClearTable}
              className="flex h-12 items-center gap-2.5 rounded-2xl bg-rose-500/10 px-6 text-[12px] font-black uppercase tracking-widest text-rose-400 transition-all hover:bg-rose-500/20"
            >
              <Eraser size={18} />
              Clear
            </button>

            <button 
              onClick={() => setSelectedTable(null)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Reservations Section (Bottom, Scrollable) */}
        <div className="mt-12 flex flex-col min-h-0 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#0c1424]" size={20} />
              <h2 className="text-[18px] font-black text-[#0c1424] tracking-tight">Today's Reservations</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
              {reservations.length} Bookings
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {reservations.length === 0 ? (
              <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[11px]">
                No reservations for today
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 p-5 transition-all hover:border-[#5dc7ec]/30 hover:bg-white">
                    <div>
                      <div className="text-[15px] font-black text-[#0c1424]">{res.customerName}</div>
                      <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><Users size={14} /> {res.guests} PPL</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#5dc7ec]">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddTableModal && (
        <AddTableModal 
          onClose={() => setShowAddTableModal(false)}
          onSuccess={() => {
            setShowAddTableModal(false);
            void loadData();
          }}
        />
      )}

      {showAddResModal && (
        <AddReservationModal
          onClose={() => setShowAddResModal(false)}
          onSuccess={() => {
            setShowAddResModal(false);
            void loadData();
          }}
          initialFloor={activeFloor}
        />
      )}

      {showMergeModal && (
        <MergeTablesModal
          tables={tables}
          initialFloor={activeFloor}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            setShowMergeModal(false);
            void loadData();
          }}
        />
      )}
    </div>
  );
}

// Separate Modal Component for Merging
function MergeTablesModal({ tables, initialFloor, onClose, onSuccess }: { 
  tables: Table[], 
  initialFloor: string,
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [floor, setFloor] = useState(initialFloor);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTables = tables.filter(t => t.floor === floor && t.status === 'AVAILABLE');

  const handleToggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMerge = async () => {
    if (selectedIds.length < 2) return;
    setIsSubmitting(true);
    try {
      await api.post('/tables/merge', { tableIds: selectedIds });
      onSuccess();
    } catch (err) {
      console.error('Merge failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c1424]/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[22px] font-black text-[#0c1424]">Merge Tables</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>

        <div className="mb-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Floor</label>
          <div className="mt-2 flex gap-2">
            {['GROUND', 'TERRACE', 'BAR'].map(f => (
              <button
                key={f}
                onClick={() => { setFloor(f); setSelectedIds([]); }}
                className={`flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase transition-all ${
                  floor === f ? 'bg-[#0c1424] text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {availableTables.map(t => (
              <button
                key={t.id}
                onClick={() => handleToggle(t.id)}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${
                  selectedIds.includes(t.id) 
                    ? 'border-[#5dc7ec] bg-[#5dc7ec]/5 text-[#0c1424]' 
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <span className="text-[18px] font-black">{t.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.seats} Seats</span>
              </button>
            ))}
            {availableTables.length === 0 && (
              <div className="col-span-2 py-8 text-center text-[12px] font-bold text-slate-300 uppercase tracking-widest">
                No available tables
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleMerge}
          disabled={selectedIds.length < 2 || isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0c1424] py-4 text-[14px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-black disabled:opacity-30 transition-all"
        >
          {isSubmitting ? 'Merging...' : 'Confirm Merge'}
        </button>
      </div>
    </div>
  );
}
