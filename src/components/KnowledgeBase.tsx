import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Trash2, Database, Clock, Filter, ArrowUp, ArrowDown, XCircle, Loader2, Plus, Search, MoreHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UploadedFile } from '../types';
import { formatBytes } from '../services/utils';
import { API_URL } from '../services/config';

interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
}

const KnowledgeBase: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Notification State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/files`);
      if (response.ok) {
        const data = await response.json();
        const mappedFiles: UploadedFile[] = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            size: f.size || 0,
            hash: f.hash,
            status: f.status,
            // Check both created_at (Supabase default) and uploadDate
            uploadDate: new Date(f.created_at || f.uploadDate || Date.now())
        }));
        setFiles(mappedFiles);
      } else {
          throw new Error("Failed to fetch");
      }
    } catch (error) {
      if (files.length === 0) {
        // Mock data if backend is down
        setFiles([
            { id: '1', name: 'demo_policy.pdf', size: 1024 * 1024 * 2.5, hash: 'demo123', status: 'success', uploadDate: new Date() },
        ]);
      }
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const tempId = Date.now().toString();
    
    // Add temporary file to UI
    const tempFile: UploadedFile = {
        id: tempId, name: file.name, size: file.size, hash: '...', status: 'processing', uploadDate: new Date()
    };
    setFiles(prev => [tempFile, ...prev]);

    try {
        const response = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (response.status === 409) {
            setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'duplicate', hash: result.file.hash, id: result.file.id || tempId } : f));
            showToast(`Duplicate File: "${file.name}" already exists.`, 'warning');
        } else if (response.ok) {
            // Update with real ID and Success status
            setFiles(prev => prev.map(f => f.id === tempId ? { 
                ...f, 
                status: 'success', 
                hash: result.file.hash, 
                id: result.file.id,
                uploadDate: new Date(result.file.created_at || Date.now())
            } : f));
            showToast(`${file.name} uploaded successfully!`, 'success');
        } else {
            console.error("Upload error response:", result);
            setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error' } : f));
            showToast(`Upload failed for ${file.name}.`, 'error');
        }
    } catch (error) {
        console.error("Upload failed:", error);
        setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error' } : f));
        showToast(`Network error uploading ${file.name}.`, 'error');
    } finally {
        setUploading(false);
    }
  };

  const deleteFile = async (id: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
    }

    setDeletingId(id);
    try {
        await fetch(`${API_URL}/api/files/${id}`, { method: 'DELETE' });
        setFiles((prev) => prev.filter((f) => f.id !== id));
        showToast(`File "${fileName}" deleted.`, 'success');
    } catch (e) {
        // If backend fails, just delete locally from list
        setFiles((prev) => prev.filter((f) => f.id !== id));
        showToast(`File "${fileName}" removed locally.`, 'warning');
    } finally {
        setDeletingId(null);
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (filterStatus !== 'all' && file.status !== filterStatus) return false;
        if (filterType !== 'all') {
          const extension = file.name.split('.').pop()?.toLowerCase();
          if (filterType === 'pdf' && extension !== 'pdf') return false;
          // ... other types
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name': comparison = a.name.localeCompare(b.name); break;
          case 'size': comparison = a.size - b.size; break;
          case 'date': comparison = a.uploadDate.getTime() - b.uploadDate.getTime(); break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [files, filterStatus, filterType, sortBy, sortOrder]);

  const StatusBadge = ({ status }: { status: string }) => {
      switch(status) {
          case 'success': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Indexed</span>;
          case 'processing': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Indexing...</span>;
          case 'error': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3 h-3 mr-1"/> Error</span>;
          default: return <span title="This file was rejected because it already exists." className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><AlertTriangle className="w-3 h-3 mr-1"/> Duplicate</span>;
      }
  };

  return (
    <div className="space-y-4 h-full flex flex-col animate-fade-in relative">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg border flex items-center gap-3 animate-fade-in transition-all ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => setToast(prev => ({...prev, show: false}))} className="ml-2 hover:opacity-70"><XCircle className="w-4 h-4" /></button>
          </div>
      )}

      {/* 1. Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-slate-300 shadow-sm">
         <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>Content Library</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {files.length} items
                </span>
            </h2>
         </div>
         <div className="flex items-center space-x-3">
             {/* Search */}
             <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search files..." className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none w-64" />
             </div>
             
             {/* Upload Button */}
             <button 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={uploading}
             >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload New'}
             </button>
             <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => e.target.files && Array.from(e.target.files).forEach(processFile)} disabled={uploading} />
         </div>
      </div>

      {/* 2. Data Grid (Table) */}
      <div className="flex-1 bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden flex flex-col">
         {/* Table Toolbar */}
         <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-slate-600">
                 <Filter className="w-4 h-4" />
                 <span className="font-semibold">Filter:</span>
                 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none">
                     <option value="all">Status: All</option>
                     <option value="success">Indexed</option>
                     <option value="processing">Processing</option>
                 </select>
             </div>
             <div className="h-4 w-px bg-slate-300"></div>
             <div className="flex items-center gap-2 text-sm text-slate-600">
                 <span className="font-semibold">Sort:</span>
                 <button onClick={() => setSortBy('date')} className={`px-2 py-1 rounded text-xs ${sortBy === 'date' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200'}`}>Date</button>
                 <button onClick={() => setSortBy('name')} className={`px-2 py-1 rounded text-xs ${sortBy === 'name' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200'}`}>Name</button>
             </div>
         </div>

         {/* The Table */}
         <div className="flex-1 overflow-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                         <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                         <th className="px-6 py-3">File Name</th>
                         <th className="px-6 py-3">Size</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3">Uploaded</th>
                         <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredAndSortedFiles.map((file) => (
                         <tr key={file.id} className="hover:bg-slate-50 group transition-colors">
                             <td className="px-6 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                             <td className="px-6 py-3 font-medium text-slate-700 flex items-center gap-3">
                                 <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><FileText className="w-4 h-4" /></div>
                                 {file.name}
                             </td>
                             <td className="px-6 py-3 text-slate-500 font-mono text-xs">{formatBytes(file.size)}</td>
                             <td className="px-6 py-3"><StatusBadge status={file.status} /></td>
                             <td className="px-6 py-3 text-slate-500 text-xs">{file.uploadDate.toLocaleDateString()} {file.uploadDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                             <td className="px-6 py-3 text-right">
                                 <button 
                                    onClick={() => deleteFile(file.id, file.name)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                 >
                                     {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                 </button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
             {filteredAndSortedFiles.length === 0 && (
                 <div className="p-12 text-center text-slate-400">
                     <UploadCloud className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>No documents found.</p>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;