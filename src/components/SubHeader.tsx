import React from 'react';
import { Filter, Calendar, ChevronDown, Search, RotateCcw, RefreshCw } from 'lucide-react';

interface SubHeaderProps {
  lastSync: string;
  dataAktif: number;
  cctvRowsCount: number;
  cctvLastDate: string;
  woRowsCount: number;
  woLastDate: string;
  poRowsCount: number;
  poLastDate: string;
  selectedUlp: string;
  onUlpChange: (ulp: string) => void;
  ulpList: string[];
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  activeTab: 'CCTV' | 'OVER_SLA' | 'RATING';
  onForceRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SubHeader: React.FC<SubHeaderProps> = ({ 
  lastSync, 
  dataAktif, 
  cctvRowsCount,
  cctvLastDate,
  woRowsCount,
  woLastDate,
  poRowsCount,
  poLastDate,
  selectedUlp, 
  onUlpChange,
  ulpList,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activeTab,
  onForceRefresh,
  isRefreshing
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-brand-secondary rounded-full" />
          <h2 className="text-2xl font-black italic tracking-tighter text-brand-primary">
            {activeTab === 'CCTV' ? (
              <>MONITORING <span className="text-brand-secondary">CCTV</span></>
            ) : activeTab === 'OVER_SLA' ? (
              <>MONITORING <span className="text-brand-secondary">OVER SLA RPT DAN RCT</span></>
            ) : (
              <>MONITORING <span className="text-brand-secondary">RATING</span></>
            )}
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* CCTV DATA */}
          <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">CCTV DATA:</span>
            <span className="text-[10px] font-black text-brand-primary leading-none">{cctvRowsCount}</span>
            <span className="text-[8px] font-bold text-gray-500 leading-none">({cctvLastDate})</span>
          </div>

          {/* WO DATA */}
          <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black tracking-wider uppercase text-blue-600">WO DATA:</span>
            <span className="text-[10px] font-black text-blue-900 leading-none">{woRowsCount}</span>
            <span className="text-[8px] font-bold text-blue-500 leading-none">({woLastDate})</span>
          </div>

          {/* PO DATA */}
          <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black tracking-wider uppercase text-amber-600">PO DATA:</span>
            <span className="text-[10px] font-black text-amber-900 leading-none">{poRowsCount}</span>
            <span className="text-[8px] font-bold text-amber-600 leading-none">({poLastDate})</span>
          </div>

          <div className="flex items-center gap-2 text-gray-400 pl-2">
            <RefreshCw size={11} className="animate-spin-slow" />
            <span className="text-[9px] font-black uppercase tracking-wider">TERAKHIR SINKRONISASI: {lastSync}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-4">
          <div className="flex items-center gap-2 text-gray-400 border-r border-gray-200 pr-4">
            <Filter size={16} />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase">MULAI:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold text-brand-primary outline-none focus:border-brand-secondary transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase">AKHIR:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold text-brand-primary outline-none focus:border-brand-secondary transition-colors"
              />
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="relative group">
            <button className="flex items-center gap-2 text-[10px] font-black text-brand-primary tracking-wider hover:opacity-70 transition-opacity uppercase">
              {selectedUlp || "SEMUA KANTOR UNIT"}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] py-2">
              <button 
                onClick={() => onUlpChange("")}
                className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:text-brand-primary uppercase"
              >
                SEMUA KANTOR UNIT
              </button>
              {ulpList.map(ulp => (
                <button 
                  key={ulp}
                  onClick={() => onUlpChange(ulp)}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:text-brand-primary uppercase"
                >
                  {ulp}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        <button 
          onClick={() => {
            onUlpChange("");
            onStartDateChange("");
            onEndDateChange("");
          }}
          className="bg-brand-secondary/10 text-brand-secondary p-2.5 rounded-xl hover:bg-brand-secondary/20 transition-colors"
        >
          <RotateCcw size={18} />
        </button>

        <button 
          onClick={onForceRefresh}
          disabled={isRefreshing}
          className={`bg-brand-secondary text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "SINKRONISASI..." : "SINKRON PAKSA"}
        </button>
      </div>
    </div>
  );
};
