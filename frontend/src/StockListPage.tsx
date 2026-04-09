import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Wine,
  Coffee,
  IceCream,
  Croissant
} from 'lucide-react';
import NewItemModal from './NewItemModal';
import AdjustStockModal from './AdjustStockModal';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  type?: 'default' | 'error';
}

function StatCard({ title, value, subValue, icon, type = 'default' }: StatCardProps) {
  const isError = type === 'error';
  return (
    <div className={`rounded-[24px] p-8 border shadow-sm flex flex-col gap-4 ${isError ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-50'}`}>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className={`text-[36px] font-black tracking-tight ${isError ? 'text-rose-600' : 'text-[#0c1424]'}`}>{value}</span>
          {subValue && (
            <span className={`text-[12px] font-bold ${isError ? 'text-rose-400' : 'text-emerald-500'}`}>{subValue}</span>
          )}
        </div>
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isError ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const STOCK_DATA = [
  {
    id: 'WH-992',
    name: 'Bourbon Whiskey (Premium)',
    category: 'Spirits',
    linkedMenu: 'Old Fashioned',
    quantity: '42 Units',
    threshold: '12 Units',
    status: 'OK',
    lastUpdated: 'Today, 09:42 AM',
    icon: <Wine size={20} />
  },
  {
    id: 'BE-201',
    name: 'Arabica Coffee Beans',
    category: 'Coffee',
    linkedMenu: 'Old Fashioned',
    quantity: '8.5 kg',
    threshold: '10 kg',
    status: 'LOW',
    lastUpdated: 'Today, 09:42 AM',
    icon: <Coffee size={20} />
  },
  {
    id: 'IC-004',
    name: 'Madagascar Vanilla Bean',
    category: 'Ice Cream',
    linkedMenu: 'Old Fashioned',
    quantity: '0.0 kg',
    threshold: '2 kg',
    status: 'OUT',
    lastUpdated: 'Today, 09:42 AM',
    icon: <IceCream size={20} />
  },
  {
    id: 'BR-882',
    name: 'Sourdough Loaves',
    category: 'Bakery',
    linkedMenu: 'Old Fashioned',
    quantity: '18 units',
    threshold: '5 units',
    status: 'OK',
    lastUpdated: 'Today, 09:42 AM',
    icon: <Croissant size={20} />
  }
];

export default function StockListPage() {
  const [isNewItemOpen, setIsNewItemOpen] = React.useState(false);
  const [adjustingItem, setAdjustingItem] = React.useState<any>(null);

  const handleAddNew = (item: any) => {
    console.log('Adding new item:', item);
    setIsNewItemOpen(false);
  };

  const handleAdjust = (adjustment: any) => {
    console.log('Adjusting stock:', adjustment);
    setAdjustingItem(null);
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[34px] font-black text-[#0c1424] leading-none tracking-tight">Main Stock List</h1>
          <p className="text-slate-500 mt-3 font-medium">Manage your ingredient levels and menu link requirements.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="h-14 px-8 rounded-full bg-white border border-slate-100 text-[#0c1424] text-[14px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsNewItemOpen(true)}
            className="h-14 px-8 rounded-full bg-[#0c1424] text-white text-[14px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black transition-all flex items-center gap-3"
          >
            <Plus size={18} />
            New Item
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <StatCard 
            title="Total Inventory Value" 
            value="$42,890" 
            subValue="+4.2%" 
            icon={<Package size={24} />} 
          />
        </div>
        <div className="lg:col-span-1">
          <StatCard 
            title="Out of Stock" 
            value="03" 
            icon={<AlertTriangle size={24} />} 
            type="error"
          />
        </div>
        <div className="hidden lg:block lg:col-span-1">
           {/* Placeholder for visual balance or another metric */}
           <div className="h-full rounded-[24px] border border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
             Detailed Analytics Available
           </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[40px] border border-slate-50 shadow-sm overflow-hidden flex flex-col">
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/20">
                <th className="text-left py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Menu Item</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Quantity</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Threshold</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</th>
                <th className="text-right py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {STOCK_DATA.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/40 transition-colors">
                  <td className="py-8 px-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-[#5dc7ec] transition-all duration-300">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-black text-[#0c1424]">{item.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">ID: {item.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-4 text-center">
                    <span className="bg-blue-50 text-[10px] font-black text-[#5dc7ec] px-4 py-1 rounded-full uppercase tracking-widest">
                      {item.linkedMenu}
                    </span>
                  </td>
                  <td className="py-8 px-4 text-center">
                    <span className={`text-[15px] font-black ${item.status === 'OUT' ? 'text-rose-500' : item.status === 'LOW' ? 'text-amber-500' : 'text-[#0c1424]'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-8 px-4 text-center text-slate-400 font-bold text-[14px]">
                    {item.threshold}
                  </td>
                  <td className="py-8 px-4">
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.status === 'OK' ? 'bg-emerald-500' : item.status === 'LOW' ? 'bg-amber-500' : 'bg-rose-500'} shadow-sm`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${item.status === 'OK' ? 'text-emerald-500' : item.status === 'LOW' ? 'text-amber-500' : 'text-rose-500'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-4 text-[13px] font-bold text-slate-400">
                    {item.lastUpdated}
                  </td>
                  <td className="py-8 px-10 text-right">
                    <button 
                      onClick={() => setAdjustingItem(item)}
                      className="h-12 px-6 rounded-2xl bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-10 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
             Showing 1 to 4 of 128 items
           </span>
           <div className="flex items-center gap-3">
              <button className="h-10 w-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button className="h-10 w-10 rounded-2xl bg-[#0c1424] text-white text-[13px] font-black flex items-center justify-center shadow-xl shadow-black/20">1</button>
              <button className="h-10 w-10 rounded-2xl text-slate-400 text-[13px] font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">2</button>
              <button className="h-10 w-10 rounded-2xl text-slate-400 text-[13px] font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">3</button>
              <button className="h-10 w-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>

      <NewItemModal 
        isOpen={isNewItemOpen} 
        onClose={() => setIsNewItemOpen(false)} 
        onAdd={handleAddNew} 
      />

      <AdjustStockModal 
        isOpen={!!adjustingItem} 
        onClose={() => setAdjustingItem(null)} 
        item={adjustingItem} 
        onUpdate={handleAdjust} 
      />
    </div>
  );
}
