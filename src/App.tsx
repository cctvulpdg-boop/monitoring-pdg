import React, { useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { SubHeader } from './components/SubHeader.tsx';
import { WOUP3Card } from './components/WOUP3Card.tsx';
import { ULPStatsCard } from './components/ULPStatsCard.tsx';
import { POUP3Card } from './components/POUP3Card.tsx';
import { ULPPOStatsCard } from './components/ULPPOStatsCard.tsx';
import { PerformanceTable } from './components/PerformanceTable.tsx';
import { ULPPerformanceTable } from './components/ULPPerformanceTable.tsx';
import { DetailModal } from './components/DetailModal.tsx';
import { OverSLAPage } from './components/OverSLAPage.tsx';
import { RatingPage } from './components/RatingPage.tsx';
import { GoogleSheetsService } from './services/googleSheetsService.ts';
import { DashboardData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUlp, setSelectedUlp] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<'CCTV' | 'OVER_SLA' | 'RATING'>('CCTV');
  
  // Clear filter when changing tabs since the filter source (ULP vs Posko) changes
  useEffect(() => {
    setSelectedUlp("");
  }, [activeTab]);

  const formatDateForQuery = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set default date range to current month on initial load
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(formatDateForQuery(firstDay));
    setEndDate(formatDateForQuery(now));
  }, []);

  // Memoized filter logic
  const filteredData = React.useMemo(() => {
    if (!data) return null;
    
    const getAvg = (item: any) => {
      const woVal = parseFloat(item.persenWo) || 0;
      const poVal = parseFloat(item.persenPo) || 0;
      const hasWo = (item.jumlahWoTotal || 0) > 0;
      const hasPo = (item.jumlahPoTotal || 0) > 0;
      if (hasWo && hasPo) return (woVal + poVal) / 2;
      if (hasWo) return woVal;
      if (hasPo) return poVal;
      return 0;
    };

    const cleanUlp = (name: any) => {
      if (!name) return "";
      return String(name).toUpperCase()
        .replace(/^POSKO ULP\s+/i, "")
        .replace(/^ULP\s+/i, "")
        .replace(/^POSKO\s+/i, "")
        .replace(/\s+/g, "")
        .trim();
    };

    const targetUlp = selectedUlp ? cleanUlp(selectedUlp) : "";

    const filteredTotalWoPlnMobileList = selectedUlp
      ? data.rating.totalWoPlnMobileList.filter(row => cleanUlp(row[3]) === targetUlp)
      : data.rating.totalWoPlnMobileList;

    const filteredRating5List = selectedUlp
      ? data.rating.rating5List.filter(row => cleanUlp(row[3]) === targetUlp)
      : data.rating.rating5List;

    const filteredRating34List = selectedUlp
      ? data.rating.rating34List.filter(row => cleanUlp(row[3]) === targetUlp)
      : data.rating.rating34List;

    const filteredRating12List = selectedUlp
      ? data.rating.rating12List.filter(row => cleanUlp(row[3]) === targetUlp)
      : data.rating.rating12List;

    const filteredNoRatingList = selectedUlp
      ? data.rating.noRatingList.filter(row => cleanUlp(row[3]) === targetUlp)
      : data.rating.noRatingList;

    const totalWoPlnMobile = filteredTotalWoPlnMobileList.length;
    const rating5 = filteredRating5List.length;
    const rating34 = filteredRating34List.length;
    const rating12 = filteredRating12List.length;
    const noRating = filteredNoRatingList.length;

    return {
      ...data,
      ulpPerformance: (selectedUlp 
        ? data.ulpPerformance.filter(u => u.ulp === selectedUlp)
        : data.ulpPerformance
      ).sort((a, b) => getAvg(b) - getAvg(a)),
      officerPerformance: (selectedUlp
        ? data.officerPerformance.filter(o => o.ulp === selectedUlp)
        : data.officerPerformance
      ).sort((a, b) => getAvg(b) - getAvg(a)),
      summary: data.summary,
      rating: {
        ...data.rating,
        totalWoPlnMobile,
        rating5,
        rating34,
        rating12,
        noRating,
        totalWoPlnMobileList: filteredTotalWoPlnMobileList,
        rating5List: filteredRating5List,
        rating34List: filteredRating34List,
        rating12List: filteredRating12List,
        noRatingList: filteredNoRatingList,
        officerRatings: selectedUlp
          ? data.rating.officerRatings.filter(o => cleanUlp(o.ulp) === targetUlp)
          : data.rating.officerRatings,
        kpRatings: selectedUlp
          ? data.rating.kpRatings.filter(k => cleanUlp(k.ulp) === targetUlp)
          : data.rating.kpRatings,
        ulpRatings: selectedUlp
          ? data.rating.ulpRatings.filter(u => cleanUlp(u.namaUlp) === targetUlp)
          : data.rating.ulpRatings
      }
    };
  }, [data, selectedUlp]);

  const dynamicDataAktif = React.useMemo(() => {
    if (!filteredData) return 0;
    if (activeTab === 'CCTV') {
      return (filteredData.summary.totalBaca || 0) + (filteredData.summary.totalPo || 0);
    } else if (activeTab === 'OVER_SLA') {
      return filteredData.overSla.totalGangguan || 0;
    } else if (activeTab === 'RATING') {
      return filteredData.rating.totalWoPlnMobile || 0;
    }
    return 0;
  }, [filteredData, activeTab]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalHeaders, setModalHeaders] = useState<string[]>([]);
  const [modalRows, setModalRows] = useState<any[][]>([]);

  // Filter logic options
  const filterList = React.useMemo(() => {
    if (!data) return [];
    // Both CCTV and OVER_SLA now use UNIT (ULP) filter as requested
    return data.allUlps || [];
  }, [data]);

  const handleDetailClick = (type: 'WO' | 'PO', identifier: string, isUlp: boolean, isCctv: boolean) => {
    if (!data) return;

    const cleanUlp = (name: any) => {
      if (!name) return "";
      return String(name).toUpperCase()
        .replace(/^POSKO ULP\s+/i, "")
        .replace(/^ULP\s+/i, "")
        .replace(/^POSKO\s+/i, "")
        .replace(/\s+/g, "")
        .trim();
    };

    const cleanName = (str: any) => {
      return String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    };

    const headers = type === 'WO' ? data.woHeaders : data.poHeaders;
    const rawRows = type === 'WO' ? data.rawWoRows : data.rawPoRows;
    const indices = type === 'WO' ? data.woIndices : data.poIndices;

    // Build officer to ULP map for fallback
    const officerToUlpMap = new Map<string, string>();
    data.officerPerformance.forEach(op => {
      officerToUlpMap.set(cleanName(op.name), cleanUlp(op.ulp));
    });

    let filteredRows = rawRows;

    // 1. Filter by CCTV if requested
    if (isCctv) {
      filteredRows = filteredRows.filter(row => {
        const cctvVal = String(row[indices.cctv] || '').toUpperCase();
        return cctvVal.includes('CCTV');
      });
    }

    // 2. Filter by ULP or Officer
    if (identifier === "UP3" || identifier === "ALL") {
      setModalTitle(`DETAIL DATA ${type}${isCctv ? ' (CCTV)' : ''} - UP3 PADANG`);
    } else if (isUlp) {
      const targetUlp = cleanUlp(identifier);
      filteredRows = filteredRows.filter(row => {
        let rowUlp = "";
        if (indices.ulp !== -1 && row[indices.ulp]) {
          rowUlp = cleanUlp(row[indices.ulp]);
        } else {
          // Fallback to officer mapping
          const rowName = cleanName(row[indices.name]);
          rowUlp = officerToUlpMap.get(rowName) || "";
        }
        return rowUlp === targetUlp;
      });
      setModalTitle(`DETAIL DATA ${type}${isCctv ? ' (CCTV)' : ''} - ULP: ${identifier}`);
    } else {
      const targetName = cleanName(identifier);
      filteredRows = filteredRows.filter(row => {
        const rowName = cleanName(row[indices.name]);
        return rowName === targetName;
      });
      setModalTitle(`DETAIL DATA ${type}${isCctv ? ' (CCTV)' : ''} - PETUGAS: ${identifier}`);
    }

    // 3. De-duplicate filteredRows by unique ID (No Laporan for WO, No Tugas/ID for PO)
    let idIdx = -1;
    if (type === 'WO') {
      idIdx = (indices.apktNo !== undefined && indices.apktNo !== null && indices.apktNo !== -1) ? indices.apktNo : -1;
      if (idIdx === -1) {
        idIdx = headers.findIndex(h => {
          const s = String(h || "").toLowerCase();
          return s.includes("laporan") || s.includes("apkt") || s.includes("id");
        });
      }
    } else {
      idIdx = (indices as any).id !== undefined && (indices as any).id !== null && (indices as any).id !== -1 ? (indices as any).id : -1;
      if (idIdx === -1) {
        idIdx = headers.findIndex(h => {
          const s = String(h || "").toLowerCase();
          return s.includes("tugas") || s.includes("id");
        });
      }
      if (idIdx === -1) {
        // Fallback: search for standard poCols[3] position (usually at column index 4)
        idIdx = 4;
      }
    }

    if (idIdx !== undefined && idIdx !== null && idIdx !== -1) {
      const uniqueMap = new Map<string, any[]>();
      filteredRows.forEach(row => {
        if (row.length > idIdx) {
          const id = String(row[idIdx] || "").trim().toUpperCase();
          if (id && !uniqueMap.has(id)) {
            uniqueMap.set(id, row);
          }
        }
      });
      filteredRows = Array.from(uniqueMap.values());
    }

    setModalHeaders(headers);
    setModalRows(filteredRows);
    setModalOpen(true);
  };

  const handleOverSLADetailClick = (criteria: string, value?: string) => {
    if (!data) return;

    const cleanUlp = (name: any) => {
      if (!name) return "";
      return String(name).toUpperCase()
        .replace(/^POSKO ULP\s+/i, "")
        .replace(/^ULP\s+/i, "")
        .replace(/^POSKO\s+/i, "")
        .replace(/\s+/g, "")
        .trim();
    };

    const cleanName = (str: any) => {
      return String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    };

    const headers = data.woHeaders;
    const rawRows = data.rawWoRows;
    const indices = data.woIndices;

    let filteredRows = rawRows;
    let title = "DETAIL DATA OVER SLA";

    const getRptValue = (row: any[]) => {
      if (indices.rpt !== -1 && row[indices.rpt]) {
        return parseFloat(String(row[indices.rpt]).replace(",", "."));
      }
      return -1;
    };

    const getRctValue = (row: any[]) => {
      if (indices.rct !== -1 && row[indices.rct]) {
        return parseFloat(String(row[indices.rct]).replace(",", "."));
      }
      return -1;
    };

    switch (criteria) {
      case 'ALL':
        title = "DETAIL SELURUH DATA GANGGUAN";
        break;
      case 'RPT_OVER_30':
        filteredRows = rawRows.filter(row => getRptValue(row) >= 30);
        title = "DETAIL WO RPT > 30 MENIT";
        break;
      case 'RPT_OVER_45':
        filteredRows = rawRows.filter(row => getRptValue(row) >= 45);
        title = "DETAIL WO RPT > 45 MENIT";
        break;
      case 'HIGHEST_RPT':
        const maxRpt = Math.max(...rawRows.map(row => getRptValue(row)));
        filteredRows = rawRows.filter(row => getRptValue(row) === maxRpt);
        title = "DETAIL DURASI RPT TERTINGGI";
        break;
      case 'HIGHEST_RCT':
        const maxRct = Math.max(...rawRows.map(row => getRctValue(row)));
        filteredRows = rawRows.filter(row => getRctValue(row) === maxRct);
        title = "DETAIL DURASI RCT TERTINGGI";
        break;
      case 'AVG_RPT':
        filteredRows = rawRows.filter(row => getRptValue(row) >= 0);
        title = "DETAIL DATA RATA-RATA RPT";
        break;
      case 'AVG_RCT':
        filteredRows = rawRows.filter(row => getRctValue(row) >= 0);
        title = "DETAIL DATA RATA-RATA RCT";
        break;
      case 'ULP':
        if (value) {
          const targetUlp = cleanUlp(value);
          filteredRows = rawRows.filter(row => {
            let rowUlp = "";
            if (indices.ulp !== -1 && row[indices.ulp]) {
              rowUlp = cleanUlp(row[indices.ulp]);
            }
            return rowUlp === targetUlp || cleanName(row[indices.name]).includes(targetUlp);
          });
          title = `DETAIL DATA WO - ULP: ${value}`;
        }
        break;
    }

    setModalHeaders(headers);
    setModalRows(filteredRows);
    setModalOpen(true);
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await GoogleSheetsService.triggerAppsScriptSync();
      const result = await GoogleSheetsService.fetchData(startDate, endDate, selectedUlp, true);
      const hasData = result.officerPerformance.length > 0 || result.summary.dataAktif > 0;
      if (!hasData) {
        setError("Tidak ada data yang ditemukan untuk rentang tanggal ini.");
      } else {
        setError(null);
      }
      setData(result);
    } catch (err) {
      console.error("Failed to force refresh data:", err);
      setError("Gagal melakukan sinkronisasi dengan Google Sheets.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async (showLoading = false) => {
      // If we already have data and are just changing ULP, we don't need a full-page loader
      // the new caching logic in GoogleSheetsService handles this instantly
      const needsFullLoader = !data || (showLoading && !isRefreshing);
      
      if (needsFullLoader) setIsRefreshing(true);
      
      try {
        const result = await GoogleSheetsService.fetchData(startDate, endDate, selectedUlp);
        const hasData = result.officerPerformance.length > 0 || result.summary.dataAktif > 0;
        if (!hasData) {
          setError("Tidak ada data yang ditemukan untuk rentang tanggal ini.");
        } else {
          setError(null);
        }
        setData(result);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Gagal menghubungkan ke Google Sheets.");
      } finally {
        setIsRefreshing(false);
      }
    };

    loadData(!data);
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [startDate, endDate, selectedUlp]);

  if (error && !data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a1128] text-white p-6 gap-6">
        <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-lg max-w-2xl w-full text-center">
          <h2 className="text-2xl font-black text-red-500 tracking-widest uppercase mb-4">KESALAHAN SINKRONISASI</h2>
          <p className="text-white/80 font-bold mb-6">{error}</p>
          <div className="text-left bg-black/40 p-4 rounded text-xs font-mono text-brand-accent/80 space-y-2">
            <p className="font-bold text-white mb-1 underline">LANGKAH PERBAIKAN:</p>
            <p>1. Buka Google Sheet Anda.</p>
            <p>2. Klik menu <span className="text-white">File &gt; Share &gt; Publish to web</span>.</p>
            <p>3. Pilih <span className="text-white">"Entire Document"</span> dan <span className="text-white">"Comma-separated values (.csv)"</span>.</p>
            <p>4. Klik <span className="text-white">Publish</span>.</p>
            <p>5. Refresh halaman ini.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 bg-brand-accent text-[#0a1128] px-8 py-3 font-black tracking-widest uppercase hover:bg-white transition-colors"
          >
            COBA LAGI SEKARANG
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a1128] text-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <h2 className="text-xl font-black tracking-widest uppercase">MEMUAT DATA...</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {isRefreshing && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100]">
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: "100%" }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-full bg-brand-accent w-full"
          />
        </div>
      )}

      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SubHeader 
        lastSync={data.summary.lastSync} 
        dataAktif={dynamicDataAktif} 
        cctvRowsCount={data.summary.cctvRowsCount || 0}
        cctvLastDate={data.summary.cctvLastDate || "-"}
        woRowsCount={data.summary.woRowsCount || 0}
        woLastDate={data.summary.woLastDate || "-"}
        poRowsCount={data.summary.poRowsCount || 0}
        poLastDate={data.summary.poLastDate || "-"}
        selectedUlp={selectedUlp}
        onUlpChange={setSelectedUlp}
        ulpList={filterList}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        activeTab={activeTab}
        onForceRefresh={handleForceRefresh}
        isRefreshing={isRefreshing}
      />
      
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={startDate + endDate + selectedUlp + activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={isRefreshing ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}
          >
            {activeTab === 'CCTV' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                {/* Left Column - WO UP3 & ULP Cards */}
                <div className="lg:col-span-3 flex flex-col">
                  <WOUP3Card 
                    totalWo={filteredData?.summary.totalBaca || 0} 
                    totalWoCctv={filteredData?.summary.totalValid || 0} 
                    onDetailClick={(isCctv) => handleDetailClick('WO', 'UP3', true, isCctv)}
                  />
                  <ULPStatsCard 
                    ulpData={filteredData?.ulpPerformance || []} 
                    onDetailClick={(ulp, isCctv) => handleDetailClick('WO', ulp, true, isCctv)}
                    ulpList={data?.allUlps || []}
                  />
                </div>

                {/* Center Column - Performance Tables */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  <PerformanceTable 
                    data={filteredData?.officerPerformance || []} 
                    onDetailClick={(type, name, isCctv) => handleDetailClick(type, name, false, isCctv)}
                  />
                  <ULPPerformanceTable 
                    data={filteredData?.ulpPerformance || []} 
                    onDetailClick={(type, ulp, isCctv) => handleDetailClick(type, ulp, true, isCctv)}
                  />
                </div>

                {/* Right Column - PO UP3 & ULP Cards */}
                <div className="lg:col-span-3 flex flex-col">
                  <POUP3Card 
                    totalPo={filteredData?.summary.totalPo || 0} 
                    totalPoCctv={filteredData?.summary.totalPoCctv || 0} 
                    onDetailClick={(isCctv) => handleDetailClick('PO', 'UP3', true, isCctv)}
                  />
                  <ULPPOStatsCard 
                    ulpData={filteredData?.ulpPerformance || []} 
                    onDetailClick={(ulp, isCctv) => handleDetailClick('PO', ulp, true, isCctv)}
                    ulpList={data?.allUlps || []}
                  />
                </div>
              </div>
            ) : activeTab === 'OVER_SLA' ? (
              <OverSLAPage 
                data={filteredData?.overSla || data.overSla} 
                onDetailClick={handleOverSLADetailClick}
              />
            ) : (
              <RatingPage data={filteredData || data} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <DetailModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        headers={modalHeaders}
        rows={modalRows}
      />

      <footer className="bg-white border-t border-gray-100 p-4 text-center">
        <p className="text-[10px] font-black text-gray-300 tracking-[0.5em] uppercase">
          © 2026 PLN ELECTRICITY SERVICES • REGIONAL SUMATERA BARAT • UL PADANG
        </p>
      </footer>
    </div>
  );
}
