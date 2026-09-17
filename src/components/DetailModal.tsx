import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headers: string[];
  rows: any[][];
}

export function DetailModal({ isOpen, onClose, title, headers, rows }: DetailModalProps) {
  if (!isOpen) return null;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset page when search or rows change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rows]);

  const detectAndGetImageUrl = (value: any, header: string): string | null => {
    if (value === null || value === undefined) return null;
    let str = String(value).trim();
    if (!str) return null;

    // 1. Check if the value is a formula like =IMAGE("url")
    const imageFormulaMatch = str.match(/=IMAGE\s*\(\s*["']([^"']+)["']/i);
    if (imageFormulaMatch) {
      str = imageFormulaMatch[1];
    }

    // 2. Check if the string is a direct URL or Google Drive link
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const driveFileMatch = str.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      const driveOpenMatch = str.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
      const docUcMatch = str.match(/docs\.google\.com\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/);
      
      const fileId = (driveFileMatch && driveFileMatch[1]) || 
                     (driveOpenMatch && driveOpenMatch[1]) || 
                     (docUcMatch && docUcMatch[1]);
                     
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
      
      const h = header.toLowerCase();
      const isImageHeader = h.includes('foto') || h.includes('gambar') || h.includes('bukti') || h.includes('image') || h.includes('cctv') || h.includes('dokumen') || h.includes('link');
      
      if (isImageHeader || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(str)) {
        return str;
      }
    }

    // 3. Check if the column header refers to a photo/image and value looks like a Google Drive ID
    const h = header.toLowerCase();
    const isImageHeader = h.includes('foto') || h.includes('gambar') || h.includes('bukti') || h.includes('image') || h.includes('cctv') || h.includes('dokumen');
    if (isImageHeader && /^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
      return `https://lh3.googleusercontent.com/d/${str}`;
    }

    return null;
  };

  const isDateColumn = (header: string) => {
    const h = header.toUpperCase();
    return h.includes('TGL') || h.includes('TANGGAL') || h.includes('DATE') || h.includes('TIME') || h.includes('CHECK IN') || h.includes('JAM');
  };

  const formatCellValue = (value: any, header: string) => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (!str) return '';

    if (isDateColumn(header)) {
      // 1. Handle serial dates (numeric)
      const normalizedStr = str.replace(',', '.');
      if (/^\d{5}(\.\d+)?$/.test(normalizedStr) || (/^0\.\d+$/.test(normalizedStr)) || (/^\d+\.\d+$/.test(normalizedStr) && parseFloat(normalizedStr) > 30000)) {
        const serial = parseFloat(normalizedStr);
        const totalSeconds = Math.round((serial - 25569) * 86400);
        const dUtc = new Date(totalSeconds * 1000);
        const date = new Date(
          dUtc.getUTCFullYear(),
          dUtc.getUTCMonth(),
          dUtc.getUTCDate(),
          dUtc.getUTCHours(),
          dUtc.getUTCMinutes(),
          dUtc.getUTCSeconds()
        );
        
        const showDate = serial >= 1;
        
        return date.toLocaleString('id-ID', {
          day: showDate ? '2-digit' : undefined,
          month: showDate ? '2-digit' : undefined,
          year: showDate ? 'numeric' : undefined,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\./g, ':');
      }

      const parseManual = (s: string) => {
        const months: Record<string, number> = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
          'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
        };
        
        let dateStr = s;
        let timeStr = '';
        const spaceIdx = s.indexOf(' ');
        const tIdx = s.indexOf('T');
        const splitIdx = spaceIdx !== -1 ? spaceIdx : (tIdx !== -1 ? tIdx : -1);
        
        if (splitIdx !== -1) {
          dateStr = s.substring(0, splitIdx).trim();
          timeStr = s.substring(splitIdx + 1).trim();
        }

        const dateParts = dateStr.toLowerCase().split(/[-/.\s,]+/);
        if (dateParts.length >= 3) {
          let day = parseInt(dateParts[0]);
          let monthStr = dateParts[1];
          let month = months[monthStr];
          let year = parseInt(dateParts[2]);
          
          if (isNaN(month)) {
            month = parseInt(monthStr) - 1;
          }

          if (isNaN(month) || month < 0 || month > 11) {
            day = parseInt(dateParts[2]);
            monthStr = dateParts[1];
            month = months[monthStr];
            if (isNaN(month)) month = parseInt(monthStr) - 1;
            year = parseInt(dateParts[0]);
          }

          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900) {
            const date = new Date(year, month, day);
            if (timeStr) {
               const timeMatch = timeStr.match(/(\d{1,2})[:.](\d{1,2})([:.](\d{1,2}))?/);
               if (timeMatch) {
                 date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[4] || '0'));
               }
            }
            return date;
          }
        }
        return null;
      };

      const d = parseManual(str) || new Date(str);
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d.toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\./g, ':');
      }
    }

    return str;
  };

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter(row => {
      return row.some(cell => {
        if (cell === null || cell === undefined) return false;
        return String(cell).toLowerCase().includes(query);
      });
    });
  }, [rows, searchQuery]);

  // Paginated rows for rendering
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageClamped = Math.min(Math.max(1, currentPage), totalPages);
  
  const displayedRows = useMemo(() => {
    if (pageSize >= filteredRows.length) return filteredRows;
    const start = (currentPageClamped - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPageClamped, pageSize]);

  const handleExportExcel = () => {
    // Generate formatted rows based on display values in UI from filteredRows
    const formattedRows = filteredRows.map(row => 
      row.map((cell, j) => formatCellValue(cell, headers[j]))
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...formattedRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Detail");

    // Save file as .xlsx
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-7xl h-full max-h-[92vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-cyan-600 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center shrink-0">
                <FileText size={20} className="text-[#0a1128]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black tracking-widest uppercase truncate max-w-[400px] sm:max-w-xl">{title}</h3>
                <p className="text-[10px] font-bold text-brand-accent/80 tracking-widest uppercase">DETAIL DATA RESMI GOOGLE SHEETS</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-export-excel-detail-modal"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all shadow-sm active:scale-95"
              >
                <Download size={13} />
                <span>EXPORT EXCEL</span>
              </button>
              <button
                id="btn-close-detail-modal"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-red-500 transition-colors rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search and Pagination Toolbar */}
          <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="input-search-detail-modal"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci (nama, no laporan, tanggal, dsb)..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-8 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                <span className="hidden sm:inline text-[11px] text-gray-500">Baris:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={1000}>1000</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                  <button
                    disabled={currentPageClamped <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-[11px] font-black text-brand-primary">
                    {currentPageClamped} / {totalPages}
                  </span>
                  <button
                    disabled={currentPageClamped >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50 custom-scrollbar">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto max-h-full">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-r border-gray-200">
                      NO
                    </th>
                    {headers.map((header, i) => (
                      <th key={i} className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap border-r border-gray-200 last:border-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length > 0 ? (
                    displayedRows.map((row, i) => {
                      const rowNumber = (currentPageClamped - 1) * pageSize + i + 1;
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-2 text-[10px] font-mono font-bold text-gray-400 text-center border-r border-gray-100">
                            {rowNumber}
                          </td>
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2 text-[11px] font-medium text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-0">
                              {(() => {
                                const imgUrl = detectAndGetImageUrl(cell, headers[j]);
                                if (imgUrl) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <div className="relative group cursor-zoom-in">
                                        <img 
                                          src={imgUrl} 
                                          alt={headers[j]} 
                                          className="h-9 w-14 object-cover rounded border border-gray-200 shadow-sm transition-all group-hover:brightness-90 group-hover:scale-105"
                                          referrerPolicy="no-referrer"
                                          onClick={() => setSelectedImage(imgUrl)}
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                      <a 
                                        href={imgUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-cyan-600 hover:underline hover:text-cyan-700 text-[10px] font-black tracking-wider uppercase flex items-center gap-0.5"
                                      >
                                        BUKA ↗
                                      </a>
                                    </div>
                                  );
                                }
                                return formatCellValue(cell, headers[j]);
                              })()}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={headers.length + 1} className="px-4 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                        {searchQuery ? `Tidak ada data yang cocok dengan "${searchQuery}"` : "Tidak ada data yang ditemukan"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-gray-600 tracking-wider uppercase">
                TOTAL: {filteredRows.length.toLocaleString('id-ID')} BARIS
                {filteredRows.length !== rows.length && (
                  <span className="text-gray-400 font-bold ml-1.5">
                    (disaring dari {rows.length.toLocaleString('id-ID')})
                  </span>
                )}
              </span>
            </div>
            <p className="text-[10px] font-black text-gray-400 tracking-[0.25em] uppercase">
              PLN ELECTRICITY SERVICES • ES PADANG
            </p>
          </div>
        </motion.div>

        {/* Lightbox for full screen image view */}
        <AnimatePresence>
          {selectedImage && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedImage(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-5xl max-h-[85vh] z-10 flex flex-col items-center justify-center"
              >
                <img
                  src={selectedImage}
                  alt="Bukti Foto CCTV Full"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <a
                    href={selectedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center justify-center"
                    title="Buka di tab baru"
                  >
                    <Download size={18} />
                  </a>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors flex items-center justify-center"
                    title="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-3 text-white/70 text-[10px] font-bold tracking-widest uppercase bg-black/50 px-4 py-1.5 rounded-full">
                  KLIK DI MANA SAJA UNTUK MENUTUP
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
