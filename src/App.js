import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Users, Archive, Search, LogOut, 
  DollarSign, FileText, Menu, X, CheckCircle, 
  LayoutDashboard, ChevronRight, Filter,
  Ship, Anchor, Wrench, Utensils, Receipt,
  Package, RotateCcw, AlertTriangle, ChevronLeft,
  ArrowRight, Plus, Trash2, Edit3, Save, Barcode, Calendar,
  RefreshCw, Download, Upload, FileSpreadsheet, Lock, ShieldCheck,
  Settings, Moon, Sun, LayoutGrid, List, UserCog, User,
  TrendingUp, CreditCard, DollarSign as DollarIcon, Building2,
  FileText as FileTextIcon, Eye, Tags, CheckSquare, Square, ListChecks, Check
} from 'lucide-react';

// --- 工具函數 ---

const formatDateTime = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("無資料可匯出");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
      cell = cell.replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(','))
  ].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const exportToText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.setAttribute("download", `${filename}.txt`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

const parseCSV = (text) => {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const currentline = lines[i].split(','); 
    if (currentline.length === headers.length) {
       const obj = {};
       for (let j = 0; j < headers.length; j++) {
         let val = currentline[j].trim();
         if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
         obj[headers[j]] = val;
       }
       result.push(obj);
    }
  }
  return result;
};

// --- 資料庫與初始資料 ---
const INITIAL_PRODUCTS = [
  { id: 'P001', name: '暈船藥', price: 150, category: '藥品', stock: 45, barcode: '88001', isOnSale: true },
  { id: 'P002', name: '可口可樂', price: 30, category: '飲料', stock: 110, barcode: '88002', isOnSale: true },
  { id: 'P003', name: '海鮮泡麵', price: 45, category: '食品', stock: 75, barcode: '88003', isOnSale: true },
  { id: 'P004', name: '七星香菸', price: 125, category: '雜貨', stock: 190, barcode: '88004', isOnSale: true },
  { id: 'P005', name: '打火機', price: 20, category: '雜貨', stock: 48, barcode: '88005', isOnSale: true },
  { id: 'P006', name: '礦泉水', price: 20, category: '飲料', stock: 180, barcode: '88006', isOnSale: true },
  { id: 'P008', name: '藍白拖', price: 100, category: '雜貨', stock: 20, barcode: '88007', isOnSale: true },
];

const INITIAL_CUSTOMERS = [
  { id: 'C001', name: '張三 (艦長)', dept: '指揮部', balance: 0 },
  { id: 'C002', name: '李四 (副長)', dept: '指揮部', balance: 0 },
  { id: 'C003', name: '王五 (輪機長)', dept: '輪機部', balance: 0 },
  { id: 'C005', name: '阿財 (伙房兵)', dept: '補給部', balance: 0 },
];

const MOCK_HISTORY_ORDERS = [];

const INITIAL_USERS = [
  { id: 'U001', name: '值更官 (Admin)', pin: '1234', role: 'admin', requireChange: true },
  { id: 'U002', name: '福利委員', pin: '0000', role: 'staff', requireChange: false },
];

const INITIAL_DEPARTMENTS = ['指揮部', '輪機部', '補給部', '戰系部'];
const INITIAL_CATEGORIES = ['雜貨', '飲料', '食品', '藥品'];

// --- 樣式輔助 ---
const getStyles = (isDarkMode) => ({
  bgMain: isDarkMode ? 'bg-slate-900' : 'bg-slate-50',
  bgCard: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
  textMain: isDarkMode ? 'text-white' : 'text-slate-900',
  textSub: isDarkMode ? 'text-slate-400' : 'text-slate-500',
  header: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
  input: isDarkMode ? 'bg-slate-700 text-white placeholder-slate-400' : 'bg-slate-100 text-slate-800',
  sidebar: isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900',
  hover: isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100',
  cardMetrics: isDarkMode ? 'bg-slate-700' : 'bg-white',
  selected: isDarkMode ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-50 border-blue-400',
});

// --- 獨立 UI 元件 ---

const Header = ({ title, rightElement, onMenuClick, isDarkMode }) => {
  const s = getStyles(isDarkMode);
  return (
    <div className={`${s.header} border-b px-4 py-3 flex items-center justify-between shrink-0 h-16 sticky top-0 z-40 transition-colors duration-300`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className={`p-2 -ml-2 rounded-full shrink-0 ${s.textSub} ${s.hover}`}>
          <Menu />
        </button>
        {typeof title === 'string' ? (
          <span className={`font-bold text-lg truncate ${s.textMain}`}>{title}</span>
        ) : (
          <div className="flex-1 min-w-0">{title}</div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
          {rightElement}
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, setIsOpen, currentUser, onLogout, navigateTo, currentView, isDarkMode, onUserClick }) => {
  const s = getStyles(isDarkMode);
  return (
    <div className={`absolute inset-0 z-50 flex ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <div className={`relative w-72 h-full shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${s.sidebar}`}>
        
        <button 
            onClick={onUserClick}
            className={`p-6 text-left w-full transition-colors ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800 hover:bg-slate-700'} text-white group`}
        >
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  {currentUser?.name?.[0]}
                </div>
                <div>
                  <div className="font-bold">{currentUser?.name}</div>
                  <div className="text-xs text-slate-300">ID: {currentUser?.id}</div>
                </div>
              </div>
              <UserCog size={18} className="text-slate-400 group-hover:text-white" />
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pl-1">點擊管理/切換收銀員</div>
        </button>

        <div className="flex-1 py-2 overflow-y-auto">
           <MenuItem icon={<ShoppingCart />} label="銷售結帳" onClick={() => navigateTo('pos')} active={currentView === 'pos' || currentView === 'customer_select' || currentView === 'payment'} isDarkMode={isDarkMode} />
           <MenuItem icon={<Receipt />} label="歷史收據" onClick={() => navigateTo('receipt_list')} active={currentView.includes('receipt')} isDarkMode={isDarkMode} />
           <MenuItem icon={<Package />} label="商品管理" onClick={() => navigateTo('items_manage')} active={currentView === 'items_manage'} isDarkMode={isDarkMode} />
           <MenuItem icon={<LayoutDashboard />} label="後台報表" onClick={() => navigateTo('dashboard')} active={currentView === 'dashboard'} isDarkMode={isDarkMode} />
           <div className={`my-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}></div>
           <MenuItem icon={<Settings />} label="系統設定" onClick={() => navigateTo('settings')} active={currentView === 'settings'} isDarkMode={isDarkMode} />
        </div>
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
           <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 rounded-xl font-bold ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'}`}>
             <LogOut size={20} /> 登出系統
           </button>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, active, isDarkMode }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 transition border-l-4 ${active ? 'bg-blue-500/10 border-blue-600 text-blue-500' : `border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}`}>
    <span className={active ? 'text-blue-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-400')}>{icon}</span>
    <span className="font-medium text-lg">{label}</span>
  </button>
);

// --- 彈窗組件 ---

const PinConfirmModal = ({ isOpen, onClose, onConfirm, currentUser, isDarkMode, message }) => {
    const s = getStyles(isDarkMode);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    if (!isOpen) return null;
    const handleConfirm = () => {
        if (pin === currentUser.pin) { onConfirm(); setPin(''); setError(''); onClose(); } 
        else { setError('PIN 碼錯誤'); setPin(''); }
    };
    return (
        <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <div className={`${s.bgCard} w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200`}>
                <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3"><Lock size={24} /></div>
                    <h3 className={`font-bold text-lg ${s.textMain}`}>需要驗證</h3>
                    <p className={`text-sm ${s.textSub} text-center`}>{message || '請輸入您的 PIN 碼以執行操作'}</p>
                </div>
                <div className="flex justify-center mb-4"><div className={`text-3xl font-mono tracking-widest py-2 px-6 rounded-lg bg-slate-100 text-slate-800`}>{pin ? pin.replace(/./g, '•') : '____'}</div></div>
                {error && <div className="text-red-500 text-sm text-center mb-4 font-bold">{error}</div>}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => setPin(p => (p.length < 4 ? p + n : p))} className={`h-12 rounded-lg font-bold text-lg ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>{n}</button>)}
                    <button onClick={() => setPin('')} className="h-12 rounded-lg font-bold text-red-500 bg-red-50">C</button>
                    <button onClick={() => setPin(p => (p.length < 4 ? p + '0' : p))} className={`h-12 rounded-lg font-bold text-lg ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>0</button>
                    <button onClick={handleConfirm} className="h-12 rounded-lg font-bold bg-blue-600 text-white shadow-md active:scale-95 transition">OK</button>
                </div>
                <button onClick={() => { onClose(); setPin(''); setError(''); }} className={`w-full py-2 text-sm font-bold ${s.textSub}`}>取消</button>
            </div>
        </div>
    );
};

const DepartmentManagementModal = ({ isOpen, onClose, departments, setDepartments, customers, setCustomers, isDarkMode }) => {
    const s = getStyles(isDarkMode); const [newDept, setNewDept] = useState(''); const [editMode, setEditMode] = useState(null);  const [editValue, setEditValue] = useState('');
    if (!isOpen) return null;
    const handleAdd = () => { if (newDept && !departments.includes(newDept)) { setDepartments([...departments, newDept]); setNewDept(''); } };
    const handleDelete = (dept) => { if (confirm(`刪除「${dept}」？\n注意：屬於此部門的客戶將會保留，但部門欄位會變為空白。`)) { setDepartments(departments.filter(d => d !== dept)); setCustomers(customers.map(c => c.dept === dept ? { ...c, dept: '' } : c)); } };
    const startEdit = (dept) => { setEditMode(dept); setEditValue(dept); };
    const saveEdit = (oldDept) => { if (editValue && editValue !== oldDept) { setDepartments(departments.map(d => d === oldDept ? editValue : d)); setCustomers(customers.map(c => c.dept === oldDept ? { ...c, dept: editValue } : c)); } setEditMode(null); };
    return ( <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"> <div className={`${s.bgCard} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%]`}> <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}> <h3 className={`font-bold text-lg flex items-center gap-2 ${s.textMain}`}><Building2 size={20} /> 部門管理</h3> <button onClick={onClose} className={`p-1 rounded-full ${s.textSub} hover:bg-slate-100/10`}><X /></button> </div> <div className="flex-1 overflow-y-auto p-4"> <div className="flex gap-2 mb-4"> <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="新增部門" className={`flex-1 p-2 rounded-lg outline-none ${s.input}`} /> <button onClick={handleAdd} className="bg-blue-600 text-white px-4 rounded-lg font-bold">新增</button> </div> <div className="space-y-2"> {departments.map(dept => ( <div key={dept} className={`p-3 rounded-xl border flex justify-between items-center ${s.bgCard}`}> {editMode === dept ? ( <div className="flex gap-2 flex-1"> <input value={editValue} onChange={e => setEditValue(e.target.value)} className={`flex-1 p-1 rounded ${s.input} text-sm`} autoFocus /> <button onClick={() => saveEdit(dept)} className="text-green-500 font-bold px-2">OK</button> </div> ) : ( <span className={`font-bold ${s.textMain}`}>{dept}</span> )} <div className="flex gap-1"> {editMode !== dept && <button onClick={() => startEdit(dept)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={16} /></button>} <button onClick={() => handleDelete(dept)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button> </div> </div> ))} </div> </div> </div> </div> );
};

const CashierManagementModal = ({ isDarkMode, users, setUsers, currentUser, setCurrentUser, onClose }) => {
    const s = getStyles(isDarkMode); const [viewMode, setViewMode] = useState('list');  const [formData, setFormData] = useState({ name: '', pin: '', role: 'staff' }); const [editingId, setEditingId] = useState(null);
    const handleAdd = () => { if(!formData.name || !formData.pin) return; const newU = { id: `U${Date.now().toString().slice(-4)}`, name: formData.name, pin: formData.pin, role: formData.role, requireChange: true }; setUsers([...users, newU]); setViewMode('list'); setFormData({ name: '', pin: '', role: 'staff' }); };
    const handleEdit = () => { setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u)); setViewMode('list'); setEditingId(null); };
    const handleDelete = (id) => { if (users.length <= 1) { alert("至少需保留一位"); return; } if (confirm('確定刪除？')) setUsers(users.filter(u => u.id !== id)); };
    const startEdit = (user) => { setFormData({ name: user.name, pin: user.pin, role: user.role }); setEditingId(user.id); setViewMode('edit'); };
    const handleSwitchUser = (user) => { setCurrentUser(user); onClose(); };
    return ( <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"> <div className={`${s.bgCard} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%]`}> <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}> <h3 className={`font-bold text-lg ${s.textMain}`}>{viewMode === 'list' ? '收銀員管理' : viewMode === 'add' ? '新增人員' : '編輯人員'}</h3> <button onClick={onClose} className={`p-1 rounded-full ${s.textSub} hover:bg-slate-100/10`}><X /></button> </div> <div className="flex-1 overflow-y-auto p-4"> {viewMode === 'list' ? ( <div className="space-y-3"> <button onClick={() => { setViewMode('add'); setFormData({ name: '', pin: '', role: 'staff' }); }} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 transition"> <Plus size={18} /> 新增收銀員 </button> {users.map(u => ( <div key={u.id} className={`p-3 rounded-xl border flex justify-between items-center ${u.id === currentUser.id ? 'border-blue-500 bg-blue-500/5' : isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}> <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleSwitchUser(u)}> <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role==='admin'?'bg-red-500':'bg-blue-500'}`}>{u.name[0]}</div> <div><div className={`font-bold ${s.textMain} flex items-center gap-2`}>{u.name} {u.id === currentUser.id && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full">目前</span>}</div><div className="text-xs text-slate-400">PIN: {u.pin}</div></div> </div> <div className="flex gap-1"> <button onClick={() => startEdit(u)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={16} /></button> <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button> </div> </div> ))} </div> ) : ( <div className="space-y-4"> <div><label className={`text-xs block mb-1 ${s.textSub}`}>名稱</label><input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} /></div> <div><label className={`text-xs block mb-1 ${s.textSub}`}>PIN 碼</label><input value={formData.pin} onChange={e=>setFormData({...formData, pin: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} /></div> <div className="flex gap-2 mt-4"> <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100 text-slate-600'}`}>取消</button> <button onClick={viewMode === 'add' ? handleAdd : handleEdit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">儲存</button> </div> </div> )} </div> </div> </div> );
};

const CategoryManagementModal = ({ isOpen, onClose, categories, setCategories, products, setProducts, isDarkMode }) => {
    // ... (保持原樣)
    const s = getStyles(isDarkMode); const [newCat, setNewCat] = useState(''); const [editMode, setEditMode] = useState(null);  const [editValue, setEditValue] = useState('');
    if (!isOpen) return null;
    const handleAdd = () => { if (newCat && !categories.includes(newCat)) { setCategories([...categories, newCat]); setNewCat(''); } };
    const handleDelete = (cat) => { if (confirm(`刪除「${cat}」？\n注意：屬於此種類的商品將變更為「未分類」。`)) { setCategories(categories.filter(c => c !== cat)); setProducts(products.map(p => p.category === cat ? { ...p, category: '未分類' } : p)); } };
    const startEdit = (cat) => { setEditMode(cat); setEditValue(cat); };
    const saveEdit = (oldCat) => { if (editValue && editValue !== oldCat) { setCategories(categories.map(c => c === oldCat ? editValue : c)); setProducts(products.map(p => p.category === oldCat ? { ...p, category: editValue } : p)); } setEditMode(null); };
    return ( <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"> <div className={`${s.bgCard} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%]`}> <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}> <h3 className={`font-bold text-lg flex items-center gap-2 ${s.textMain}`}><Tags size={20} /> 種類管理</h3> <button onClick={onClose} className={`p-1 rounded-full ${s.textSub} hover:bg-slate-100/10`}><X /></button> </div> <div className="flex-1 overflow-y-auto p-4"> <div className="flex gap-2 mb-4"> <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="新增種類" className={`flex-1 p-2 rounded-lg outline-none ${s.input}`} /> <button onClick={handleAdd} className="bg-blue-600 text-white px-4 rounded-lg font-bold">新增</button> </div> <div className="space-y-2"> {categories.map(cat => ( <div key={cat} className={`p-3 rounded-xl border flex justify-between items-center ${s.bgCard}`}> {editMode === cat ? ( <div className="flex gap-2 flex-1"> <input value={editValue} onChange={e => setEditValue(e.target.value)} className={`flex-1 p-1 rounded ${s.input} text-sm`} autoFocus /> <button onClick={() => saveEdit(cat)} className="text-green-500 font-bold px-2">OK</button> </div> ) : ( <span className={`font-bold ${s.textMain}`}>{cat}</span> )} <div className="flex gap-1"> {editMode !== cat && <button onClick={() => startEdit(cat)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={16} /></button>} <button onClick={() => handleDelete(cat)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button> </div> </div> ))} </div> </div> </div> </div> );
};

// --- View 組件 ---

// 新增：客戶歷史視圖
const CustomerHistoryView = ({ viewingCustomer, orders, setView, isDarkMode }) => {
    const s = getStyles(isDarkMode);
    
    const customerOrders = orders.filter(o => o.customer_id === viewingCustomer.id).sort((a,b) => new Date(b.date) - new Date(a.date));

    return (
        <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}>
            <div className={`${s.header} px-4 py-3 flex items-center gap-3 shadow-sm border-b`}>
                <button onClick={() => setView('customer_select')} className={`p-2 -ml-2 ${s.textSub}`}>
                    <ChevronLeft />
                </button>
                <div className="flex-1">
                    <span className={`font-bold text-lg ${s.textMain}`}>{viewingCustomer.name}</span>
                    <div className={`text-xs ${s.textSub}`}>歷史紀錄</div>
                </div>
                {/* 顯示目前餘額 (僅作參考，無紅字樣式) */}
                <div className={`text-lg font-bold ${s.textMain}`}>
                    ${viewingCustomer.balance}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {customerOrders.length === 0 ? (
                    <div className={`text-center py-10 ${s.textSub}`}>無歷史紀錄</div>
                ) : (
                    customerOrders.map(order => (
                        <div key={order.order_id} className={`p-4 rounded-xl shadow-sm border flex justify-between items-center ${s.bgCard}`}>
                            <div>
                                <div className={`font-bold ${s.textMain} text-sm mb-1`}>{order.date}</div>
                                <div className={`text-xs ${s.textSub}`}>
                                    {order.method === 'cash' ? '現金' : '記帳'} · {order.order_id}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${order.status==='refunded' ? 'text-slate-400 line-through' : 'text-blue-500'}`}>
                                    ${order.total}
                                </div>
                                {order.status === 'refunded' && <span className="text-[10px] text-red-500">已退款</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CustomerSelectView = ({ customers, setCustomers, departments, setDepartments, setActiveCustomer, setView, onMenuClick, isDarkMode, currentUser, setViewingCustomer }) => {
    const s = getStyles(isDarkMode);
    const [deptFilter, setDeptFilter] = useState('全部');
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false); // 批次模式
    const [selectedIds, setSelectedIds] = useState([]); // 批次選取ID
    const [deleteTargetId, setDeleteTargetId] = useState(null); // 單筆刪除ID
    const [editForm, setEditForm] = useState(null); 
    const [customerForm, setCustomerForm] = useState({ name: '', dept: '' }); // 移除 limit
    const fileInputRef = useRef(null);
    
    const filtered = customers.filter(c => deptFilter === '全部' || c.dept === deptFilter);

    // 切換選取模式時清空選取
    useEffect(() => {
        if (!isBatchMode) setSelectedIds([]);
    }, [isBatchMode]);

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // 處理點擊列表項目
    const handleItemClick = (c, e) => {
        if (isBatchMode) {
            e.stopPropagation(); // 阻止進入 POS
            handleSelect(c.id);
        } else {
            setActiveCustomer(c);
            setView('pos');
        }
    };

    const openAdd = () => {
        setEditForm(null);
        setCustomerForm({ name: '', dept: departments[0] });
        setIsAddEditOpen(true);
    };

    const openEdit = (customer, e) => {
        e.stopPropagation();
        setEditForm(customer);
        setCustomerForm({ name: customer.name, dept: customer.dept });
        setIsAddEditOpen(true);
    };

    const handleSave = () => {
        if (!customerForm.name) return;
        if (editForm) {
            setCustomers(customers.map(c => c.id === editForm.id ? { ...c, ...customerForm } : c));
        } else {
            const newC = {
                id: `C${Date.now().toString().slice(-4)}`,
                name: customerForm.name,
                dept: customerForm.dept,
                balance: 0,
            };
            setCustomers([...customers, newC]);
        }
        setIsAddEditOpen(false);
    };

    // 單筆刪除
    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        setDeleteTargetId(id); // 標記單筆
        setIsPinModalOpen(true);
    };

    // 批次刪除
    const handleBatchDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setDeleteTargetId('BATCH'); // 標記批次
        setIsPinModalOpen(true);
    }

    // 執行刪除 (共用 PIN 驗證回呼)
    const executeDelete = () => {
        if (deleteTargetId === 'BATCH') {
            setCustomers(customers.filter(c => !selectedIds.includes(c.id)));
            setIsBatchMode(false);
        } else {
            setCustomers(customers.filter(c => c.id !== deleteTargetId));
        }
        setDeleteTargetId(null);
    };

    const handleViewHistory = (customer, e) => {
        e.stopPropagation();
        setViewingCustomer(customer);
        setView('customer_history');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsedData = parseCSV(evt.target.result);
                if(parsedData.length > 0 && (!parsedData[0].name || !parsedData[0].dept)) {
                    alert('CSV 格式錯誤，需包含 name, dept 欄位');
                    return;
                }
                const newCustomers = parsedData.map((c, i) => ({
                    id: c.id || `C${Date.now()}-${i}`,
                    name: c.name,
                    dept: c.dept,
                    balance: parseInt(c.balance) || 0,
                }));
                setCustomers([...customers, ...newCustomers]);
                alert(`成功匯入 ${newCustomers.length} 筆客戶資料`);
            } catch (err) { alert('匯入失敗'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
      <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}>
        <Header 
            title={isBatchMode ? `已選取 ${selectedIds.length} 人` : "選擇人員"} 
            onMenuClick={onMenuClick} 
            isDarkMode={isDarkMode}
            rightElement={
                <div className="flex gap-2">
                   {!isBatchMode && (
                       <>
                        <button onClick={() => setIsDeptModalOpen(true)} className={`p-2 rounded-full ${s.textSub} ${s.header} hover:text-blue-500`} title="管理部門"><Building2 size={20} /></button>
                        <button onClick={() => exportToCSV(customers, 'crew_export')} className={`p-2 rounded-full ${s.textSub} ${s.header}`}><Download size={20} /></button>
                        <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-full ${s.textSub} ${s.header}`}><Upload size={20} /></button>
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
                       </>
                   )}
                   <button onClick={() => setIsBatchMode(!isBatchMode)} className={`p-2 rounded-full ${isBatchMode ? 'bg-blue-100 text-blue-600' : `${s.textSub} ${s.header}`}`} title="批次管理">
                        <ListChecks size={20} />
                   </button>
                   {!isBatchMode && <button onClick={openAdd} className="p-2 bg-blue-600 text-white rounded-full"><Plus size={20} /></button>}
                </div>
            }
        />
        <div className={`${s.header} px-4 pb-2 transition-colors duration-300`}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setDeptFilter('全部')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${deptFilter === '全部' ? 'bg-blue-600 text-white' : `${s.bgMain} ${s.textSub}`}`}>全部</button>
                {departments.map(dept => (
                    <button key={dept} onClick={() => setDeptFilter(dept)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${deptFilter === dept ? 'bg-blue-600 text-white' : `${s.bgMain} ${s.textSub}`}`}>{dept}</button>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
            {filtered.map(c => (
                <div 
                    key={c.id} 
                    onClick={(e) => handleItemClick(c, e)} 
                    className={`w-full p-4 rounded-xl shadow-sm border flex items-center justify-between active:scale-[0.98] transition cursor-pointer group ${s.bgCard} ${s.hover} ${selectedIds.includes(c.id) ? s.selected : ''}`}
                >
                    <div className="flex items-center gap-4">
                        {isBatchMode && (
                            <div className={`w-6 h-6 rounded border flex items-center justify-center ${selectedIds.includes(c.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                                {selectedIds.includes(c.id) && <Check size={16} className="text-white" />}
                            </div>
                        )}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${['指揮部','輪機部','補給部','戰系部'].includes(c.dept)? 'bg-blue-500' : 'bg-slate-400'}`}>{c.dept?.[0] || '?'}</div>
                        <div className="text-left"><div className={`font-bold text-lg ${s.textMain}`}>{c.name}</div><div className={`text-sm ${s.textSub}`}>{c.dept || '無部門'}</div></div>
                    </div>
                    {/* 非批次模式才顯示個別按鈕 */}
                    {!isBatchMode && (
                        <div className="flex items-center gap-3">
                            <button onClick={(e) => handleViewHistory(c, e)} className={`p-2 rounded-full ${s.textSub} hover:bg-slate-200 hover:text-blue-600 transition`} title="檢視歷史紀錄"><Eye size={18} /></button>
                            <button onClick={(e) => openEdit(c, e)} className={`p-2 rounded-full ${s.textSub} hover:bg-slate-200 hover:text-blue-600 transition`}><Edit3 size={18} /></button>
                            <button onClick={(e) => handleDeleteClick(c.id, e)} className={`p-2 rounded-full ${s.textSub} hover:bg-red-100 hover:text-red-600 transition`}><Trash2 size={18} /></button>
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* 批次操作浮動列 */}
        {isBatchMode && selectedIds.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-white shadow-xl p-2 rounded-full border border-slate-200 animate-in slide-in-from-bottom">
                 <button 
                    onClick={handleBatchDeleteClick} 
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-red-700 transition"
                 >
                    <Trash2 size={20} /> 刪除 ({selectedIds.length})
                 </button>
            </div>
        )}

        {isAddEditOpen && (
            <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className={`${s.bgCard} rounded-2xl w-full max-w-sm p-6 shadow-2xl`}>
                    <h3 className={`text-xl font-bold mb-4 ${s.textMain}`}>{editForm ? '編輯人員' : '新增人員'}</h3>
                    <div className="space-y-3">
                        <div><label className={`text-xs block mb-1 ${s.textSub}`}>姓名</label><input value={customerForm.name} onChange={e=>setCustomerForm({...customerForm, name: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} /></div>
                        <div><label className={`text-xs block mb-1 ${s.textSub}`}>部門</label><select value={customerForm.dept} onChange={e=>setCustomerForm({...customerForm, dept: e.target.value})} className={`w-full p-3 rounded-lg outline-none appearance-none ${s.input}`}><option value="">請選擇部門</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    </div>
                    <div className="flex gap-3 mt-6"><button onClick={() => setIsAddEditOpen(false)} className={`flex-1 py-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>取消</button><button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">儲存</button></div>
                </div>
            </div>
        )}
        <PinConfirmModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} onConfirm={executeDelete} currentUser={currentUser} isDarkMode={isDarkMode} message={deleteTargetId === 'BATCH' ? `確定要刪除這 ${selectedIds.length} 位人員嗎？` : undefined} />
        <DepartmentManagementModal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} departments={departments} setDepartments={setDepartments} customers={customers} setCustomers={setCustomers} isDarkMode={isDarkMode} />
      </div>
    );
};

const POSView = ({ activeCustomer, setView, products, categories, cart, addToCart, updateCartQty, removeFromCart, onMenuClick, isDarkMode, layoutMode }) => {
    const s = getStyles(isDarkMode); const [showCartDetail, setShowCartDetail] = useState(false); const [filterCategory, setFilterCategory] = useState('所有商品'); const [isSearchOpen, setIsSearchOpen] = useState(false); const [searchKeyword, setSearchKeyword] = useState('');
    const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0); const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const filteredProducts = products.filter(p => { const matchCategory = filterCategory === '所有商品' || p.category === filterCategory; const matchSearch = searchKeyword ? (p.name.includes(searchKeyword) || p.barcode?.includes(searchKeyword)) : true; const matchOnSale = p.isOnSale === true; return matchCategory && matchSearch && matchOnSale; });
    const POSHeaderContent = () => ( <div className="flex items-center gap-2 w-full max-w-[200px] sm:max-w-xs transition-all duration-300"> {isSearchOpen ? ( <div className={`flex items-center rounded-lg px-2 w-full animate-in fade-in zoom-in duration-200 ${s.input}`}> <Search size={16} className="text-slate-400 shrink-0" /> <input autoFocus value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="商品/條碼..." className="bg-transparent border-none outline-none text-sm p-2 w-full text-inherit placeholder-inherit" /> <button onClick={() => { setIsSearchOpen(false); setSearchKeyword(''); }} className="text-slate-400 p-1"><X size={16} /></button> </div> ) : ( <> <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${s.input} text-sm font-bold py-1.5 px-3 rounded-lg outline-none cursor-pointer flex-1 truncate border-r-8 border-transparent`}> <option value="所有商品">所有商品</option> {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-lg transition shrink-0 ${s.input} hover:opacity-80`}><Search size={18} /></button> </> )} </div> );
    return ( <div className={`flex flex-col h-full overflow-hidden ${s.bgMain} transition-colors duration-300`}> <Header title={<POSHeaderContent />} onMenuClick={onMenuClick} isDarkMode={isDarkMode} rightElement={ <div className="flex items-center"> <div className="text-xs mr-2 text-right hidden sm:block"> <div className={s.textSub}>客戶</div> <div className="font-bold text-blue-500">{activeCustomer?.name}</div> </div> <button onClick={() => setView('customer_select')} className={`font-bold text-sm px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500`}>換人</button> </div> } /> <div className="flex-1 overflow-y-auto p-3"> {layoutMode === 'list' ? ( <div className="flex flex-col gap-2 pb-4"> {filteredProducts.map(p => { const inCart = cart.find(c => c.id === p.id); return ( <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`flex justify-between items-center p-3 rounded-xl shadow-sm border active:border-blue-500 transition ${s.bgCard} ${s.hover}`}> <div className="flex items-center gap-3 text-left"> <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${p.stock < 10 ? 'bg-red-500' : 'bg-blue-500'}`}>{p.category[0]}</div> <div><div className={`font-bold ${s.textMain}`}>{p.name}</div><div className={`text-xs ${s.textSub}`}>${p.price} | 存: {p.stock}</div></div> </div> <div className="flex items-center gap-2"><div className="font-bold text-blue-500 text-lg">${p.price}</div>{inCart && <div className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{inCart.qty}</div>}</div> </button> ); })} </div> ) : ( <div className="grid grid-cols-2 gap-3 pb-4"> {filteredProducts.map(p => ( <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center h-32 active:border-blue-500 relative overflow-hidden group ${s.bgCard} ${s.hover}`}> {p.stock <= 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white z-10">補貨中</div>} <div className={`font-bold text-lg mb-1 ${s.textMain}`}>{p.name}</div> <div className="text-blue-500 font-bold">${p.price}</div> <div className={`absolute top-2 right-2 text-[10px] ${s.textSub}`}>庫存 {p.stock}</div> {cart.find(c => c.id === p.id) && <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md">{cart.find(c => c.id === p.id).qty}</div>} </button> ))} </div> )} {filteredProducts.length === 0 && <div className={`col-span-2 text-center py-10 ${s.textSub}`}>找不到相符商品</div>} </div> {showCartDetail && ( <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end"> <div className={`${s.bgCard} rounded-t-2xl p-4 max-h-[80%] overflow-y-auto pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200 border-none`} onClick={(e) => e.stopPropagation()}> <div className={`flex justify-between items-center mb-4 border-b pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}> <h3 className={`font-bold text-lg flex items-center gap-2 ${s.textMain}`}><ShoppingCart size={20}/> 購物車明細</h3> <button onClick={() => setShowCartDetail(false)} className={`p-2 rounded-full ${s.input}`}><X /></button> </div> {cart.length === 0 ? <p className={`text-center py-8 ${s.textSub}`}>購物車是空的</p> : cart.map(item => ( <div key={item.id} className={`flex justify-between items-center mb-4 p-3 border rounded-xl shadow-sm ${s.bgCard}`}> <div className="flex-1"><div className={`font-bold ${s.textMain}`}>{item.name}</div><div className={`text-xs ${s.textSub}`}>${item.price} / 個</div></div> <div className="flex items-center gap-3"> <button onClick={() => updateCartQty(item.id, -1)} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s.input}`}>-</button> <span className={`w-8 text-center font-bold text-xl ${s.textMain}`}>{item.qty}</span> <button onClick={() => updateCartQty(item.id, 1)} className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold hover:bg-blue-500/20">+</button> <div className="w-2"></div> <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"><Trash2 size={18} /></button> </div> </div> )) } <div className={`mt-4 pt-4 border-t flex justify-between items-center font-bold text-xl ${s.textMain} ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}><span>總計</span><span>${cartTotal}</span></div> <button onClick={() => { if(cart.length>0) setView('payment'); }} disabled={cart.length===0} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 shadow-lg">去結帳</button> </div> </div> )} <div className={`${s.header} border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0 z-30`}> <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setShowCartDetail(!showCartDetail)}> <div className={`flex items-center gap-2 ${s.textSub}`}><div className="relative"><ShoppingCart />{cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}</div><span className="font-bold text-sm">查看明細 ({cartCount}件)</span></div> <div className={`text-2xl font-bold ${s.textMain}`}>${cartTotal}</div> </div> <button onClick={() => { if(cart.length > 0) setView('payment'); }} disabled={cart.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition disabled:opacity-50">{cart.length === 0 ? '請選擇商品' : '去結帳'}</button> </div> </div> );
};
const PaymentView = ({ cart, activeCustomer, processPayment, setView, isDarkMode }) => { const s = getStyles(isDarkMode); return ( <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}> <div className={`${s.header} px-4 py-3 flex items-center gap-3 shadow-sm border-b`}> <button onClick={() => setView('pos')} className={`p-2 -ml-2 ${s.textSub}`}><ChevronLeft /></button> <span className={`font-bold text-lg ${s.textMain}`}>選擇付款方式</span> </div> <div className="p-6 flex-1 flex flex-col gap-4"> <div className={`${s.bgCard} p-6 rounded-2xl shadow-sm text-center mb-4`}> <div className={`${s.textSub} text-sm mb-1`}>應付金額</div> <div className={`text-4xl font-bold ${s.textMain}`}>${cart.reduce((s,i)=>s+(i.price*i.qty),0)}</div> <div className={`mt-4 pt-4 border-t border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between text-sm`}> <span className={s.textSub}>客戶</span><span className={`font-bold ${s.textMain}`}>{activeCustomer?.name}</span> </div> </div> <button onClick={() => processPayment('cash')} className={`flex items-center gap-4 p-5 border rounded-xl shadow-sm transition active:border-green-500 ${s.bgCard} ${s.hover}`}> <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><DollarSign /></div> <div className="text-left"><div className={`font-bold text-lg ${s.textMain}`}>現金支付 (Cash)</div></div><ArrowRight className={`ml-auto ${s.textSub}`} /> </button> <button onClick={() => processPayment('tab')} className={`flex items-center gap-4 p-5 border rounded-xl shadow-sm transition active:border-orange-500 ${s.bgCard} ${s.hover}`}> <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500"><FileText /></div> <div className="text-left"><div className={`font-bold text-lg ${s.textMain}`}>記帳/賒帳 (Tab)</div><div className={`text-sm ${s.textSub}`}>將紀錄於個人帳戶</div></div><ArrowRight className={`ml-auto ${s.textSub}`} /> </button> </div> </div> )};
const ReceiptListView = ({ orders, setSelectedReceipt, setView, onMenuClick, isDarkMode }) => { const s = getStyles(isDarkMode); const [isRefreshing, setIsRefreshing] = useState(false); const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1000); }; const groupedOrders = useMemo(() => { const groups = {}; orders.forEach(order => { const dateKey = order.date.split(' ')[0]; if (!groups[dateKey]) groups[dateKey] = []; groups[dateKey].push(order); }); return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0])); }, [orders]);
    return ( <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}> <Header title="歷史收據" onMenuClick={onMenuClick} isDarkMode={isDarkMode} rightElement={<button onClick={handleRefresh} className={`p-2 rounded-full ${s.textSub} ${s.hover} ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw size={20} /></button>} /> <div className="flex-1 overflow-y-auto p-4 space-y-4"> {groupedOrders.map(([date, dayOrders]) => ( <div key={date}> <div className={`text-xs font-bold mb-2 ml-1 inline-block px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/50 text-slate-500'}`}>{date}</div> <div className="space-y-2"> {dayOrders.map((order) => ( <button key={order.order_id} onClick={() => { setSelectedReceipt(order); setView('receipt_detail'); }} className={`w-full p-4 rounded-xl shadow-sm border flex justify-between items-center ${s.bgCard} ${s.hover}`}> <div className="flex items-center gap-3"> <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${order.method==='cash'?'bg-green-500':'bg-orange-500'}`}>{order.method==='cash'?<DollarSign size={18}/>:<FileText size={18}/>}</div> <div className="text-left"> <div className={`font-bold ${s.textMain}`}>{order.customer_name} {order.status==='refunded'&&<span className="text-xs text-red-500 bg-red-100 px-1 rounded ml-1">退款</span>} {order.status==='deleted'&&<span className="text-xs text-gray-500 bg-gray-200 px-1 rounded ml-1">刪除</span>}</div> <div className={`text-xs ${s.textSub}`}>{order.date.split(' ')[1]}</div> </div> </div> <div className="font-bold text-lg text-blue-500">${order.total}</div> </button> ))} </div> </div> ))} </div> </div> );
};
const ReceiptDetailView = ({ selectedReceipt, processRefund, setView }) => { const [refundStep, setRefundStep] = useState(0); if (!selectedReceipt) return null; return ( <div className="flex flex-col h-full bg-slate-100"> <div className="bg-white p-4 flex items-center gap-3 border-b"><button onClick={() => setView('receipt_list')} className="p-2 -ml-2"><ChevronLeft /></button><span className="font-bold text-lg">交易詳情</span></div> <div className="flex-1 overflow-y-auto p-4"> <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden"> {selectedReceipt.status === 'refunded' && <div className="absolute top-5 right-5 border-2 border-red-500 text-red-500 px-2 font-bold -rotate-12">REFUNDED</div>} <div className="text-center border-b border-dashed pb-4 mb-4"> <div className="text-4xl font-bold text-slate-800">${selectedReceipt.total}</div> <div className="flex justify-center mt-2"> {selectedReceipt.method === 'cash' ? <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-sm flex items-center gap-1"><DollarSign size={14} /> 現金支付 (Cash)</span> : <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm flex items-center gap-1"><FileText size={14} /> 記帳/賒帳 (Tab)</span>} </div> <div className="text-sm text-slate-500 mt-2">{selectedReceipt.date}</div> </div> <div className="space-y-3 text-sm"> <div className="flex justify-between"><span className="text-slate-500">客戶</span><span className="font-bold">{selectedReceipt.customer_name}</span></div> <div className="flex justify-between"><span className="text-slate-500">收銀員</span><span className="font-bold">{selectedReceipt.cashier}</span></div> <div className="flex justify-between"><span className="text-slate-500">單號</span><span className="font-mono">{selectedReceipt.order_id}</span></div> </div> <div className="mt-4 pt-4 border-t bg-slate-50 -mx-6 -mb-6 p-6"> {selectedReceipt.items.map((i, idx) => ( <div key={idx} className="flex justify-between mb-2 text-sm"><span className="text-slate-700">{i.name} x{i.qty}</span><span className="font-medium">${i.price*i.qty}</span></div> ))} </div> </div> {selectedReceipt.status !== 'refunded' && ( <div className="mt-6"> {refundStep === 0 ? <button onClick={() => setRefundStep(1)} className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><RotateCcw size={18}/> 申請退款</button> : <div className="bg-red-50 p-4 rounded-xl border border-red-100"> <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> 確定要退款？</h4> <div className="flex gap-3"><button onClick={() => setRefundStep(0)} className="flex-1 py-3 bg-white border rounded-lg font-bold text-slate-600">取消</button><button onClick={() => { processRefund(selectedReceipt); setRefundStep(0); }} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold shadow-sm">確認退款</button></div> </div>} </div> )} </div> </div> ); };
const ReceiptSuccessView = ({ activeCustomer, setView }) => ( <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6"> <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center"> <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" /> <h2 className="text-2xl font-bold text-slate-800 mb-6">交易完成</h2> <button onClick={() => setView('customer_select')} className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold mb-3">回客戶列表</button> <button onClick={() => setView('pos')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">繼續為 {activeCustomer?.name} 點餐</button> </div> </div> );
const LoginView = ({ handleLoginCheck, isDarkMode }) => { const s = getStyles(isDarkMode); const [pin, setPin] = useState(''); const handleNumClick = (n) => { if(pin.length < 4) setPin(pin + n); }; const handleOK = () => { handleLoginCheck(pin); }; return ( <div className={`flex flex-col items-center justify-center h-full ${s.bgMain} ${s.textMain}`}> <div className="mb-6 p-4 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-500/30"><Anchor size={48} /></div> <h1 className="text-2xl font-bold mb-8">艦艇服務台 POS</h1> <div className="w-64"> <div className={`text-center text-3xl py-4 mb-6 tracking-widest rounded-xl border ${s.input} ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>{pin.padEnd(4, '•')}</div> <div className="grid grid-cols-3 gap-3"> {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handleNumClick(n)} className={`h-16 rounded-lg text-xl font-bold transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50 border border-slate-200'}`}>{n}</button>)} <button onClick={() => setPin('')} className="h-16 bg-red-500/10 text-red-500 rounded-lg font-bold">C</button> <button onClick={() => handleNumClick(0)} className={`h-16 rounded-lg font-bold ${isDarkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>0</button> <button onClick={handleOK} className="h-16 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30">OK</button> </div> </div> <p className={`mt-8 ${s.textSub} text-sm`}>請輸入 PIN 碼 (預設 1234)</p> </div> ); };
const ChangePasswordView = ({ handlePasswordChange, isDarkMode }) => { const s = getStyles(isDarkMode); const [step, setStep] = useState(1); const [newPin, setNewPin] = useState(''); const [confirmPin, setConfirmPin] = useState(''); const [error, setError] = useState(''); const handleInput = (num) => { setError(''); if (step === 1 && newPin.length < 4) setNewPin(newPin + num); if (step === 2 && confirmPin.length < 4) setConfirmPin(confirmPin + num); }; const handleClear = () => { if (step === 1) setNewPin(''); else setConfirmPin(''); setError(''); }; const handleSubmit = () => { if (step === 1) { if (newPin.length < 4) { setError('請輸入 4 位數'); return; } setStep(2); } else { if (confirmPin !== newPin) { setError('密碼不相符'); setConfirmPin(''); return; } handlePasswordChange(newPin); } }; return ( <div className={`flex flex-col items-center justify-center h-full bg-blue-900 text-white`}> <div className="mb-6 p-4 bg-blue-800 rounded-full"><ShieldCheck size={48} /></div> <h1 className="text-2xl font-bold mb-2">安全性設定</h1> <p className="mb-8 text-blue-200">{step === 1 ? '請設定您的新 PIN 碼' : '請再次輸入以確認'}</p> <div className="w-64"> <div className="text-center text-3xl py-4 mb-6 tracking-widest bg-blue-800 rounded-xl border border-blue-700 shadow-inner">{(step === 1 ? newPin : confirmPin).padEnd(4, '•')}</div> {error && <div className="text-red-300 text-sm text-center mb-4 font-bold">{error}</div>} <div className="grid grid-cols-3 gap-3"> {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handleInput(n)} className="h-16 bg-blue-800 rounded-lg text-xl font-bold active:bg-blue-700 border border-blue-700/50">{n}</button>)} <button onClick={handleClear} className="h-16 bg-red-900/50 text-red-200 rounded-lg font-bold border border-red-900/30">C</button> <button onClick={() => handleInput(0)} className="h-16 bg-blue-800 rounded-lg font-bold border border-blue-700/50">0</button> <button onClick={handleSubmit} className="h-16 bg-green-600 rounded-lg font-bold shadow-lg active:bg-green-700">{step === 1 ? '下一步' : '確認'}</button> </div> </div> </div> ); };
const SettingsView = ({ isDarkMode, setIsDarkMode, layoutMode, setLayoutMode, onMenuClick, onImportHistory }) => { const s = getStyles(isDarkMode); const fileInputRef = useRef(null); const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { onImportHistory(file); e.target.value = ''; } }; return ( <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}> <Header title="系統設定" onMenuClick={onMenuClick} isDarkMode={isDarkMode} /> <div className="p-4 flex-1"> <div className={`${s.bgCard} rounded-xl overflow-hidden mb-6`}> <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}> <div className="flex items-center gap-3">{isDarkMode ? <Moon className="text-blue-400" /> : <Sun className="text-orange-400" />}<span className={`font-bold ${s.textMain}`}>深色模式 (Dark Mode)</span></div> <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`}></div></button> </div> <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}> <div className="flex items-center gap-3">{layoutMode === 'grid' ? <LayoutGrid className={s.textSub} /> : <List className={s.textSub} />}<span className={`font-bold ${s.textMain}`}>商品佈局 (Layout)</span></div> <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}> <button onClick={() => setLayoutMode('grid')} className={`p-2 rounded-md transition ${layoutMode==='grid' ? 'bg-white shadow text-blue-600' : s.textSub}`}><LayoutGrid size={18} /></button> <button onClick={() => setLayoutMode('list')} className={`p-2 rounded-md transition ${layoutMode==='list' ? 'bg-white shadow text-blue-600' : s.textSub}`}><List size={18} /></button> </div> </div> <div className={`p-4 flex justify-between items-center`}> <div className="flex items-center gap-3"> <Archive className={s.textSub} /> <span className={`font-bold ${s.textMain}`}>匯入歷史收據</span> </div> <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm active:bg-blue-700"> <Upload size={14} /> 選擇 CSV </button> <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" /> </div> </div> </div> </div> ); };
const ItemsManageView = ({ products, setProducts, handleSaveProduct, categories, setCategories, onMenuClick, isDarkMode }) => { 
    const s = getStyles(isDarkMode); 
    const [isEditing, setIsEditing] = useState(false); 
    const [isCatModalOpen, setIsCatModalOpen] = useState(false); // 新增種類管理 Modal 狀態
    const [editForm, setEditForm] = useState(null); 
    const [filterCategory, setFilterCategory] = useState('所有商品'); 
    const [isSearchOpen, setIsSearchOpen] = useState(false); 
    const [searchKeyword, setSearchKeyword] = useState(''); 
    const fileInputRef = useRef(null); 
    const [isBatchMode, setIsBatchMode] = useState(false); // 批次模式
    const [selectedIds, setSelectedIds] = useState([]); // 批次選取ID
    const [deleteTargetId, setDeleteTargetId] = useState(null); // 單筆刪除ID
    const [isPinModalOpen, setIsPinModalOpen] = useState(false); // PIN 驗證

    // 切換選取模式時清空選取
    useEffect(() => {
        if (!isBatchMode) setSelectedIds([]);
    }, [isBatchMode]);

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const openEdit = (product) => { setEditForm({ ...product }); setIsEditing(true); }; 
    const openAdd = () => { setEditForm({ isNew: true, name: '', category: '雜貨', price: '', stock: '', barcode: '' }); setIsEditing(true); }; 
    const handleFormSave = () => { handleSaveProduct(editForm); setIsEditing(false); }; 
    const handleImport = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { try { const parsedData = parseCSV(evt.target.result); if(parsedData.length > 0 && !parsedData[0].name) { alert('CSV 格式錯誤'); return; } const newProducts = parsedData.map((p, i) => ({ id: p.id || `P${Date.now()}-${i}`, name: p.name, category: p.category || '雜貨', price: parseInt(p.price) || 0, stock: parseInt(p.stock) || 0, barcode: p.barcode || '', isOnSale: true })); setProducts([...products, ...newProducts]); alert(`成功匯入`); } catch (err) { alert('匯入失敗'); } }; reader.readAsText(file); e.target.value = ''; }; 
    const filteredProducts = products.filter(p => { const matchCategory = filterCategory === '所有商品' || p.category === filterCategory; const matchSearch = searchKeyword ? (p.name.includes(searchKeyword) || p.barcode?.includes(searchKeyword)) : true; return matchCategory && matchSearch; }); 
    
    // 批次操作
    const handleBatchDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setDeleteTargetId('BATCH');
        setIsPinModalOpen(true);
    };

    const handleBatchToggleSale = (status) => {
        if (selectedIds.length === 0) return;
        setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, isOnSale: status } : p));
        setIsBatchMode(false);
    };

    const executeDelete = () => {
        if (deleteTargetId === 'BATCH') {
            setProducts(products.filter(p => !selectedIds.includes(p.id)));
            setIsBatchMode(false);
        } else {
             // 這裡原本 ItemsManageView 沒做單筆刪除，如果要加可以在這
        }
        setDeleteTargetId(null);
    };

    const HeaderContent = () => ( <div className="flex items-center gap-2 w-full max-w-[200px] sm:max-w-xs transition-all duration-300"> {isSearchOpen ? ( <div className={`flex items-center rounded-lg px-2 w-full animate-in fade-in zoom-in duration-200 ${s.input}`}> <Search size={16} className="text-slate-400 shrink-0" /> <input autoFocus value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜尋..." className="bg-transparent border-none outline-none text-sm p-2 w-full text-inherit placeholder-inherit" /> <button onClick={() => { setIsSearchOpen(false); setSearchKeyword(''); }} className="text-slate-400 p-1"><X size={16} /></button> </div> ) : ( <> <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${s.input} text-sm font-bold py-1.5 px-3 rounded-lg outline-none cursor-pointer flex-1 truncate border-r-8 border-transparent`}> <option value="所有商品">所有商品</option> {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-lg transition shrink-0 ${s.input} hover:opacity-80`}><Search size={18} /></button> </> )} </div> ); 
    return ( 
        <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}> 
            <Header title={<HeaderContent />} onMenuClick={onMenuClick} isDarkMode={isDarkMode} rightElement={ 
                <div className="flex gap-2"> 
                    {/* 新增管理種類按鈕 */}
                    {!isBatchMode && (
                        <>
                            <button onClick={() => setIsCatModalOpen(true)} className={`p-2 rounded-full ${s.textSub} ${s.header} hover:text-blue-500`} title="管理種類"><Tags size={20} /></button>
                            <button onClick={() => exportToCSV(products, 'inventory_export')} className={`p-2 rounded-full ${s.textSub} ${s.header}`}><Download size={20} /></button> 
                            <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-full ${s.textSub} ${s.header}`}><Upload size={20} /></button> 
                            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" /> 
                        </>
                    )}
                    <button onClick={() => setIsBatchMode(!isBatchMode)} className={`p-2 rounded-full ${isBatchMode ? 'bg-blue-100 text-blue-600' : `${s.textSub} ${s.header}`}`} title="批次管理">
                        <ListChecks size={20} />
                    </button>
                    {!isBatchMode && <button onClick={openAdd} className="bg-blue-600 text-white p-2 rounded-full shadow-md active:bg-blue-700"><Plus size={20} /></button>}
                </div> 
            } /> 
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20"> {filteredProducts.map(p => ( 
                <div 
                    key={p.id} 
                    onClick={() => isBatchMode && handleSelect(p.id)}
                    className={`p-4 rounded-xl shadow-sm border flex justify-between items-center cursor-pointer ${s.bgCard} ${!p.isOnSale ? 'opacity-60' : ''} ${selectedIds.includes(p.id) ? s.selected : ''}`}
                > 
                    <div className="flex items-center gap-3">
                         {isBatchMode && (
                            <div className={`w-5 h-5 border rounded flex items-center justify-center ${selectedIds.includes(p.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                                {selectedIds.includes(p.id) && <Check size={14} className="text-white" />}
                            </div>
                        )}
                        <div>
                            <div className={`font-bold text-lg ${s.textMain}`}>{p.name} {!p.isOnSale && <span className="text-xs bg-gray-500 text-white px-1 rounded ml-1">停售</span>}</div>
                            <div className={`text-xs ${s.textSub} flex gap-2`}><span>{p.category}</span><span>|</span><span>條碼: {p.barcode || '無'}</span></div>
                            <div className="font-bold text-blue-500 mt-1">${p.price}</div>
                        </div>
                    </div> 
                    <div className="flex items-center gap-4">
                        <div className={`text-sm font-bold ${p.stock < 20 ? 'text-red-500' : 'text-green-500'}`}>庫存: {p.stock}</div>
                        {!isBatchMode && <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className={`p-2 rounded-full ${s.textSub} ${s.hover}`}><Edit3 size={18} /></button>}
                    </div> 
                </div> 
            ))} </div> 

            {/* 批次操作浮動列 */}
            {isBatchMode && selectedIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white shadow-xl p-2 rounded-full border border-slate-200 animate-in slide-in-from-bottom">
                        <button 
                        onClick={() => handleBatchToggleSale(true)} 
                        className="bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-green-700 transition text-sm"
                        >
                        上架
                        </button>
                        <button 
                        onClick={() => handleBatchToggleSale(false)} 
                        className="bg-gray-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-600 transition text-sm"
                        >
                        停售
                        </button>
                        <button 
                        onClick={handleBatchDeleteClick} 
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-red-700 transition text-sm"
                        >
                        <Trash2 size={16} /> 刪除 ({selectedIds.length})
                        </button>
                </div>
            )}

            {isEditing && ( <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4"> <div className={`${s.bgCard} rounded-2xl w-full max-w-sm p-6 shadow-2xl`}> <h3 className={`text-xl font-bold mb-4 ${s.textMain}`}>{editForm.isNew ? '新增商品' : '編輯商品'}</h3> <div className="space-y-3"> <input value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} placeholder="名稱" /> <div className="flex gap-3"><input list="cat-opts" value={editForm.category} onChange={e=>setEditForm({...editForm, category: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} placeholder="種類" /><datalist id="cat-opts">{categories.map(c=><option key={c} value={c}/>)}</datalist><input type="number" value={editForm.price} onChange={e=>setEditForm({...editForm, price: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} placeholder="$" /></div> <div className="flex gap-3"><input type="number" value={editForm.stock} onChange={e=>setEditForm({...editForm, stock: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} placeholder="庫存" /><input value={editForm.barcode} onChange={e=>setEditForm({...editForm, barcode: e.target.value})} className={`w-full p-3 rounded-lg outline-none ${s.input}`} placeholder="條碼" /></div> 
            {/* 上下架開關 */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditForm({...editForm, isOnSale: !editForm.isOnSale})}>
                <div className={`w-5 h-5 border rounded flex items-center justify-center ${editForm.isOnSale ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                    {editForm.isOnSale && <Check size={14} className="text-white" />}
                </div>
                <span className={`text-sm ${s.textMain}`}>目前販售中</span>
            </div>
            </div> <div className="flex gap-3 mt-6"><button onClick={() => setIsEditing(false)} className={`flex-1 py-3 rounded-xl font-bold ${isDarkMode?'bg-slate-700':'bg-slate-100 text-slate-600'}`}>取消</button><button onClick={handleFormSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">儲存</button></div> </div> </div> )} 
            
            {/* 種類管理 Modal */}
            <CategoryManagementModal 
                isOpen={isCatModalOpen} 
                onClose={() => setIsCatModalOpen(false)} 
                categories={categories} 
                setCategories={setCategories} 
                products={products} 
                setProducts={setProducts} 
                isDarkMode={isDarkMode} 
            />
            {/* 批次刪除驗證 */}
            <PinConfirmModal 
                isOpen={isPinModalOpen} 
                onClose={() => setIsPinModalOpen(false)} 
                onConfirm={executeDelete} 
                currentUser={currentUser} // 需要從上層傳入 currentUser
                isDarkMode={isDarkMode} 
                message={`確定要刪除這 ${selectedIds.length} 項商品嗎？`}
            />
        </div> 
    ); 
};
const DashboardView = ({ orders, customers, onMenuClick, isDarkMode }) => {
    const s = getStyles(isDarkMode);
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = today.toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ start: defaultStart, end: defaultEnd });
    
    // Add refreshing state
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate a delay for visual feedback
        setTimeout(() => {
            setIsRefreshing(false);
        }, 500);
    };

    // 1. 計算區間數據
    const stats = useMemo(() => {
        const filteredOrders = orders.filter(o => {
            const orderDate = o.date.split(' ')[0]; // formatDateTime returns YYYY-MM-DD HH:mm:ss, split by space
            return orderDate >= dateRange.start && orderDate <= dateRange.end;
        });

        const receiptCount = filteredOrders.length;
        const salesTotal = filteredOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
        const refundTotal = filteredOrders.filter(o => o.status === 'refunded').reduce((sum, o) => sum + o.total, 0);
        const netRevenue = salesTotal - refundTotal;
        // totalDebt removed

        return { receiptCount, salesTotal, refundTotal, netRevenue };
    }, [orders, customers, dateRange, isRefreshing]); 

    // 2. 匯出 CSV 報表
    const handleExportReport = () => {
        const filteredOrders = orders.filter(o => {
            const orderDate = o.date.split(' ')[0]; 
            return orderDate >= dateRange.start && orderDate <= dateRange.end;
        });

        if (filteredOrders.length === 0) { alert('無訂單'); return; }

        const flatData = filteredOrders.map(o => ({ 
            日期: o.date, 
            收據號碼: o.order_id, 
            付費方式: o.method === 'cash' ? '現金' : '記帳', 
            銷售總額: o.total,
            購買品項: o.items ? o.items.map(i => `${i.qty} X ${i.name}`).join('; ') : '',
            收銀員名稱: o.cashier,
            客戶: o.customer_name
        }));
        exportToCSV(flatData, `Receipts_${dateRange.start}_${dateRange.end}`);
    };

    // 3. 匯出記帳清單 (TXT)
    const handleExportTabList = () => {
        const filteredOrders = orders.filter(o => {
            const orderDate = o.date.split(' ')[0];
            return orderDate >= dateRange.start && orderDate <= dateRange.end && o.method === 'tab' && o.status === 'completed';
        });

        if (filteredOrders.length === 0) { alert('此區間無記帳紀錄'); return; }

        const deptMap = {};
        
        filteredOrders.forEach(o => {
            const customer = customers.find(c => c.id === o.customer_id);
            const dept = customer ? customer.dept : (o.customer_name.includes('(') ? '其他' : '未知');
            const name = o.customer_name;

            if (!deptMap[dept]) deptMap[dept] = {};
            if (!deptMap[dept][name]) deptMap[dept][name] = 0;
            deptMap[dept][name] += o.total;
        });

        let content = `記帳日期：${dateRange.start.replace(/-/g, '.')} - ${dateRange.end.replace(/-/g, '.')}\n\n`;
        let grandTotal = 0;

        Object.keys(deptMap).forEach(dept => {
            content += `${dept}\n`;
            let deptTotal = 0;
            Object.entries(deptMap[dept]).forEach(([name, amount]) => {
                content += ` . ${name}：$${amount}\n`;
                deptTotal += amount;
            });
            content += ` 小計：$${deptTotal}元\n\n`;
            grandTotal += deptTotal;
        });

        content += `記帳總金額合計：$${grandTotal}元`;

        exportToText(content, `Tab_List_${dateRange.start}_${dateRange.end}`);
    };

    const MetricCard = ({ title, value, color, icon: Icon }) => (
        <div className={`${s.cardMetrics} p-4 rounded-xl shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} flex flex-col justify-between`}>
            <div className={`text-xs ${s.textSub} mb-1 flex items-center gap-1`}>{Icon && <Icon size={12}/>} {title}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
    );

    return (
        <div className={`flex flex-col h-full ${s.bgMain} transition-colors duration-300`}>
            <Header 
                title="後台報表" 
                onMenuClick={onMenuClick} 
                isDarkMode={isDarkMode} 
                rightElement={
                    <button 
                        onClick={handleRefresh} 
                        className={`p-2 rounded-full ${s.textSub} ${s.hover} ${isRefreshing ? 'animate-spin' : ''}`}
                        title="更新數據"
                    >
                        <RefreshCw size={20} />
                    </button>
                }
            />
            <div className="flex-1 overflow-y-auto p-4">
                
                <div className={`${s.bgCard} p-3 rounded-xl shadow-sm mb-4 flex items-center gap-2`}>
                    <div className="flex-1"><label className={`text-[10px] block mb-1 ${s.textSub}`}>開始日期</label><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className={`w-full p-1.5 rounded-lg text-sm outline-none ${s.input}`} /></div>
                    <div className={s.textSub}>-</div>
                    <div className="flex-1"><label className={`text-[10px] block mb-1 ${s.textSub}`}>結束日期</label><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className={`w-full p-1.5 rounded-lg text-sm outline-none ${s.input}`} /></div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <MetricCard title="所有收據" value={`${stats.receiptCount} 筆`} color={s.textMain} icon={FileText} />
                    <MetricCard title="銷售總額" value={`$${stats.salesTotal}`} color="text-blue-500" icon={TrendingUp} />
                    <MetricCard title="退款總額" value={`$${stats.refundTotal}`} color="text-red-500" icon={RotateCcw} />
                    <MetricCard title="區間淨營收" value={`$${stats.netRevenue}`} color="text-green-500" icon={DollarIcon} />
                </div>

                <div className={`${s.bgCard} p-4 rounded-xl shadow-sm space-y-3`}>
                    <h3 className={`font-bold text-lg ${s.textMain} mb-2`}>報表匯出</h3>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg border-slate-100">
                        <div>
                            <div className={`font-bold ${s.textMain} flex items-center gap-2`}><FileSpreadsheet size={16}/> 收據明細 CSV</div>
                            <div className={`text-xs ${s.textSub}`}>所有交易流水帳</div>
                        </div>
                        <button onClick={handleExportReport} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow active:scale-95">匯出 CSV</button>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg border-slate-100">
                        <div>
                            <div className={`font-bold ${s.textMain} flex items-center gap-2`}><FileTextIcon size={16}/> 記帳人員清單 TXT</div>
                            <div className={`text-xs ${s.textSub}`}>單位/人員結算單</div>
                        </div>
                        <button onClick={handleExportTabList} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow active:scale-95">匯出清單</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- App 主程式 ---

const App = () => {
  const [view, setView] = useState('login'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tempUser, setTempUser] = useState(null); 
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState('grid');
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null); // 新增：正在查看歷史的客戶

  // Lazy Initialization for LocalStorage
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : MOCK_HISTORY_ORDERS;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('pos_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('pos_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [cart, setCart] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Auto-Save Effect
  useEffect(() => { localStorage.setItem('pos_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('pos_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('pos_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('pos_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('pos_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('pos_departments', JSON.stringify(departments)); }, [departments]);

  // Reset Data Function (Emergency Use)
  const handleResetData = () => {
    if(confirm('確定重置所有資料？此操作無法復原！')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleLoginCheck = (inputPin) => { const user = users.find(u => u.pin === inputPin); if (user) { if (user.requireChange) { setTempUser(user); setView('change_password'); } else { setCurrentUser(user); setView('customer_select'); } } else { alert('PIN 碼錯誤'); } };
  const handlePasswordChange = (newPin) => { if (!tempUser) return; const updatedUsers = users.map(u => u.id === tempUser.id ? { ...u, pin: newPin, requireChange: false } : u); setUsers(updatedUsers); const loggedInUser = updatedUsers.find(u => u.id === tempUser.id); setCurrentUser(loggedInUser); setTempUser(null); setView('customer_select'); alert('密碼修改成功！'); };
  const navigateTo = (target) => { setIsMenuOpen(false); if (target === 'pos' && !activeCustomer) { setView('customer_select'); return; } setView(target); };
  
  // 匯入歷史收據邏輯 (包含 items 格式的處理)
  const handleImportReceipts = (file) => { 
      const reader = new FileReader(); 
      reader.onload = (evt) => { 
          try { 
              const parsedData = parseCSV(evt.target.result); 
              // 檢查關鍵欄位：收據號碼 or 訂單編號
              if (parsedData.length > 0 && (!parsedData[0]['收據號碼'] && !parsedData[0]['訂單編號'])) { 
                  alert('CSV 格式錯誤，需包含"收據號碼"等欄位'); 
                  return; 
              } 
              const newOrders = parsedData.map((row, i) => ({ 
                  order_id: row['收據號碼'] || row['訂單編號'] || `IMP-${Date.now()}-${i}`, 
                  date: row['日期'], 
                  cashier: row['收銀員'] || row['收銀員名稱'] || 'Imported', 
                  customer_name: row['客戶'] || 'Unknown', 
                  customer_id: 'C-IMP', 
                  total: parseFloat(row['總計'] || row['銷售總額']) || 0, 
                  method: (row['付費方式'] === '現金' || row['付費方式'] === 'cash') ? 'cash' : 'tab', 
                  status: 'completed', 
                  items: [] // 簡化處理：歷史匯入暫不還原 items 陣列，僅作金額統計
              })); 
              setOrders([...orders, ...newOrders]); 
              alert(`成功匯入 ${newOrders.length} 筆歷史收據`); 
          } catch (err) { alert('匯入失敗'); } 
      }; 
      reader.readAsText(file); 
  };

  const addToCart = (product) => { const existing = cart.find(item => item.id === product.id); if (existing) { setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)); } else { setCart([...cart, { ...product, qty: 1 }]); } };
  const updateCartQty = (id, delta) => { const item = cart.find(i => i.id === id); if (!item) return; const newQty = item.qty + delta; if (newQty <= 0) setCart(cart.filter(i => i.id !== id)); else setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i)); };
  const removeFromCart = (id) => { setCart(cart.filter(i => i.id !== id)); };
  
  // 結帳邏輯 (使用簡單流水號 #0001，並修正日期格式)
  const processPayment = (method) => { 
      const nextId = String(orders.length + 1).padStart(4, '0');
      const newOrder = { 
          order_id: `#${nextId}`, 
          date: formatDateTime(new Date()), // 使用標準化日期格式
          cashier: currentUser.name, 
          items: cart, 
          total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0), 
          method: method, 
          customer_id: activeCustomer.id, 
          customer_name: activeCustomer.name, 
          status: 'completed' 
      }; 
      setProducts(products.map(p => { const cartItem = cart.find(c => c.id === p.id); return cartItem ? { ...p, stock: p.stock - cartItem.qty } : p; })); 
      if (method === 'tab') { setCustomers(customers.map(c => c.id === activeCustomer.id ? { ...c, balance: c.balance + newOrder.total } : c)); } 
      setOrders([newOrder, ...orders]); 
      setCart([]); 
      setView('receipt_success'); 
  };

  const processRefund = (order) => { const updatedOrders = orders.map(o => o.order_id === order.order_id ? { ...o, status: 'refunded' } : o); setOrders(updatedOrders); if (order.method === 'tab') { setCustomers(customers.map(c => c.id === order.customer_id ? { ...c, balance: c.balance - order.total } : c)); } setSelectedReceipt({ ...order, status: 'refunded' }); };
  const handleSaveProduct = (productData) => { if (productData.category && !categories.includes(productData.category)) { setCategories([...categories, productData.category]); } if (productData.isNew) { const newProduct = { ...productData, id: `P${Date.now().toString().slice(-4)}`, stock: parseInt(productData.stock) || 0, price: parseInt(productData.price) || 0 }; delete newProduct.isNew; setProducts([...products, newProduct]); } else { setProducts(products.map(p => p.id === productData.id ? { ...productData, stock: parseInt(productData.stock) || 0, price: parseInt(productData.price) || 0 } : p)); } };

  return (
    <div className={`w-full max-w-md mx-auto h-[750px] border-8 rounded-[3rem] overflow-hidden shadow-2xl relative font-sans transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-900 bg-slate-50'}`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-50"></div>
      
      {currentUser && (
        <Sidebar 
            isOpen={isMenuOpen} 
            setIsOpen={setIsMenuOpen} 
            currentUser={currentUser} 
            onLogout={() => {setCurrentUser(null); setView('login');}} 
            navigateTo={navigateTo} 
            currentView={view} 
            isDarkMode={isDarkMode}
            onUserClick={() => setIsCashierModalOpen(true)}
        />
      )}

      {isCashierModalOpen && (
          <CashierManagementModal 
              isDarkMode={isDarkMode} 
              users={users} 
              setUsers={setUsers} 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              onClose={() => setIsCashierModalOpen(false)} 
          />
      )}

      {view === 'login' && <LoginView handleLoginCheck={handleLoginCheck} isDarkMode={isDarkMode} />}
      {view === 'change_password' && <ChangePasswordView handlePasswordChange={handlePasswordChange} isDarkMode={isDarkMode} />}
      {view === 'settings' && <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} layoutMode={layoutMode} setLayoutMode={setLayoutMode} onMenuClick={() => setIsMenuOpen(true)} onImportHistory={handleImportReceipts} />}
      {/* 新增重置按鈕到設定頁面 (需稍微修改 SettingsView，但為了保持單檔簡潔，這裡僅透過 console 或隱藏方式觸發，或可視需求加入 UI) */}
      
      {view === 'customer_select' && (
        <CustomerSelectView 
            customers={customers} 
            setCustomers={setCustomers} 
            departments={departments} 
            setDepartments={setDepartments} 
            setActiveCustomer={setActiveCustomer} 
            setView={setView} 
            onMenuClick={() => setIsMenuOpen(true)} 
            isDarkMode={isDarkMode} 
            currentUser={currentUser}
            setViewingCustomer={setViewingCustomer} // 傳遞設定檢視客戶的函數
        />
      )}
      
      {/* 新增：客戶歷史收據視圖 */}
      {view === 'customer_history' && viewingCustomer && (
          <CustomerHistoryView 
            viewingCustomer={viewingCustomer} 
            orders={orders} 
            setView={setView} 
            isDarkMode={isDarkMode} 
          />
      )}
      
      {view === 'pos' && <POSView activeCustomer={activeCustomer} setView={setView} products={products} categories={categories} cart={cart} addToCart={addToCart} updateCartQty={updateCartQty} removeFromCart={removeFromCart} onMenuClick={() => setIsMenuOpen(true)} isDarkMode={isDarkMode} layoutMode={layoutMode} />}
      {view === 'payment' && <PaymentView cart={cart} activeCustomer={activeCustomer} processPayment={processPayment} setView={setView} isDarkMode={isDarkMode} />}
      {view === 'receipt_success' && <ReceiptSuccessView activeCustomer={activeCustomer} setView={setView} />}
      {view === 'receipt_list' && <ReceiptListView orders={orders} setSelectedReceipt={setSelectedReceipt} setView={setView} onMenuClick={() => setIsMenuOpen(true)} isDarkMode={isDarkMode} />}
      {view === 'receipt_detail' && <ReceiptDetailView selectedReceipt={selectedReceipt} processRefund={processRefund} setView={setView} />}
      {view === 'items_manage' && <ItemsManageView products={products} setProducts={setProducts} handleSaveProduct={handleSaveProduct} categories={categories} setCategories={setCategories} onMenuClick={() => setIsMenuOpen(true)} isDarkMode={isDarkMode} currentUser={currentUser} />}
      {view === 'dashboard' && <DashboardView orders={orders} customers={customers} onMenuClick={() => setIsMenuOpen(true)} isDarkMode={isDarkMode} />}
    </div>
  );
};

export default App;
