import React from 'react';
import {
  Package,
  AlertTriangle,
  Download,
  Plus,
} from 'lucide-react';
import NewItemModal from './NewItemModal';
import AdjustStockModal from './AdjustStockModal';
import api from './services/api';

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

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  recipeCount: number;
  updatedAt: string;
};

export default function StockListPage() {
  const [ingredients, setIngredients] = React.useState<IngredientRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isNewItemOpen, setIsNewItemOpen] = React.useState(false);
  const [adjustingItem, setAdjustingItem] = React.useState<IngredientRow | null>(null);

  const exportCsv = () => {
    const header = 'Ingredient,Quantity,Unit,LowStockThreshold,Status\n';
    const rows = ingredients
      .map((item) => {
        const status = item.quantity <= 0 ? 'OUT' : item.isLowStock ? 'LOW' : 'OK';
        return `${item.name},${item.quantity},${item.unit},${item.lowStockThreshold},${status}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadIngredients = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/inventory/ingredients');
      const rows = Array.isArray(response.data) ? response.data : [];
      setIngredients(
        rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          unit: row.unit || 'units',
          quantity: Number(row.quantity || 0),
          lowStockThreshold: Number(row.lowStockThreshold || 0),
          isLowStock: Boolean(row.isLowStock),
          recipeCount: Number(row.recipeCount || 0),
          updatedAt: row.updatedAt,
        })),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load ingredients');
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const handleAddNew = async (item: {
    name: string;
    unit: string;
    quantity: number;
    lowStockThreshold: number;
  }) => {
    try {
      await api.post('/inventory/ingredients', item);
      setIsNewItemOpen(false);
      await loadIngredients();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create ingredient');
    }
  };

  const handleAdjust = async (adjustment: {
    mode: 'ADD' | 'REMOVE' | 'SET_FIXED';
    quantity: number;
    reason: string;
    itemId: string;
  }) => {
    try {
      await api.post(`/inventory/ingredients/${adjustment.itemId}/adjust`, {
        mode: adjustment.mode,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
      });
      setAdjustingItem(null);
      await loadIngredients();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const totalStockItems = ingredients.length;
  const lowStockCount = ingredients.filter((ingredient) => ingredient.isLowStock).length;
  const outOfStockCount = ingredients.filter((ingredient) => ingredient.quantity <= 0).length;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[34px] font-black text-[#0c1424] leading-none tracking-tight">Main Stock List</h1>
          <p className="text-slate-500 mt-3 font-medium">Manage your ingredient levels and menu link requirements.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportCsv}
            className="h-14 px-8 rounded-full bg-white border border-slate-100 text-[#0c1424] text-[14px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
          >
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
            title="Tracked Ingredients" 
            value={totalStockItems} 
            subValue={`${lowStockCount} low stock`} 
            icon={<Package size={24} />} 
          />
        </div>
        <div className="lg:col-span-1">
          <StatCard 
            title="Out of Stock" 
            value={outOfStockCount.toString().padStart(2, '0')} 
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
          {error ? (
            <div className="px-10 py-4 text-sm font-semibold text-rose-600">{error}</div>
          ) : null}
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/20">
                <th className="text-left py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Recipes</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Quantity</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Threshold</th>
                <th className="text-center py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left py-8 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</th>
                <th className="text-right py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ingredients.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/40 transition-colors">
                  <td className="py-8 px-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-[#5dc7ec] transition-all duration-300">
                        <Package size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-black text-[#0c1424]">{item.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">ID: {item.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-4 text-center">
                    <span className="bg-blue-50 text-[10px] font-black text-[#5dc7ec] px-4 py-1 rounded-full uppercase tracking-widest">
                      {item.recipeCount}
                    </span>
                  </td>
                  <td className="py-8 px-4 text-center">
                    <span className={`text-[15px] font-black ${item.quantity <= 0 ? 'text-rose-500' : item.isLowStock ? 'text-amber-500' : 'text-[#0c1424]'}`}>
                      {item.quantity.toFixed(3)} {item.unit}
                    </span>
                  </td>
                  <td className="py-8 px-4 text-center text-slate-400 font-bold text-[14px]">
                    {item.lowStockThreshold.toFixed(3)} {item.unit}
                  </td>
                  <td className="py-8 px-4">
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.quantity <= 0 ? 'bg-rose-500' : item.isLowStock ? 'bg-amber-500' : 'bg-emerald-500'} shadow-sm`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${item.quantity <= 0 ? 'text-rose-500' : item.isLowStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {item.quantity <= 0 ? 'OUT' : item.isLowStock ? 'LOW' : 'OK'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-4 text-[13px] font-bold text-slate-400">
                    {new Date(item.updatedAt).toLocaleString()}
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
              {!isLoading && ingredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                    No ingredients found. Add your first ingredient to start tracking stock.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-10 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
             Showing {ingredients.length} ingredients
           </span>
           <div className="text-xs font-bold text-slate-400">Live inventory</div>
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
