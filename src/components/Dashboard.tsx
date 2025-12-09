import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { KPIStats, TopicStat, QuestionStat } from '../types';
import { MessageSquare, Activity, Users, DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, Wifi, WifiOff, Info, AlertTriangle, PlusCircle, Maximize2, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { ViewState } from '../types';
import { API_URL } from '../services/config';

interface DashboardProps {
  stats: KPIStats;
  onChangeView?: (view: ViewState) => void; // Optional prop for navigation
}

const Dashboard: React.FC<DashboardProps> = ({ stats: fallbackStats, onChangeView }) => {
  const [realStats, setRealStats] = useState<KPIStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [failCount, setFailCount] = useState(0);
  
  // Modal State
  const [detailsModal, setDetailsModal] = useState<'topics' | 'actions' | null>(null);

  const fetchStats = async () => {
    // If backend fails repeatedly, stop spamming but keep status as disconnected
    if (failCount > 5) {
        setConnectionStatus('disconnected');
        return;
    }

    try {
      const res = await fetch(`${API_URL}/api/stats`);
      if(res.ok) {
        const data = await res.json();
        setRealStats(data);
        setConnectionStatus('connected');
        setFailCount(0); 
      } else {
        throw new Error("API Error");
      }
    } catch (e) {
      setFailCount(prev => prev + 1);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [failCount]);

  // Use real data if available, otherwise fallback (Demo Mode)
  const stats = connectionStatus === 'connected' && realStats ? realStats : fallbackStats;
  
  const tokenData = stats.history?.map((h: any, i: number) => ({
      name: i.toString(),
      Input: h.input_tokens || 0,
      Output: h.output_tokens || 0
  })) || [];

  const sentimentData = stats.semantic?.sentiment || [];
  const topics = stats.semantic?.topics || [];
  const unanswered = stats.unansweredQuestions || [];

  // Helper for KPI Cards
  const KpiCard = ({ title, value, subtext, icon: Icon, trend, tooltip }: any) => (
    <div className="bg-white rounded-md border border-slate-300 shadow-sm p-4 flex flex-col justify-between h-32 hover:shadow-md transition-shadow group relative">
        <div className="flex justify-between items-start">
            <h4 className="text-slate-500 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
                {title}
                {tooltip && (
                    <div className="relative group/tooltip">
                        <Info className="w-3 h-3 text-slate-300 hover:text-indigo-500 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 normal-case font-normal">
                            {tooltip}
                        </div>
                    </div>
                )}
            </h4>
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
            {subtext && (
                <div className={`text-xs font-medium flex items-center mt-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                    {subtext}
                </div>
            )}
        </div>
    </div>
  );

  // --- DETAIL MODALS RENDERER ---
  const renderDetailsModal = () => {
    if (!detailsModal) return null;

    const isTopics = detailsModal === 'topics';
    const title = isTopics ? "Trending Topics Analysis" : "Unanswered Questions Queue";
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {isTopics ? <Activity className="w-5 h-5 text-indigo-600" /> : <AlertTriangle className="w-5 h-5 text-orange-500" />}
                        {title}
                    </h3>
                    <button onClick={() => setDetailsModal(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {isTopics ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Total Topics Tracked</h4>
                                    <p className="text-2xl font-bold text-slate-800">{topics.length}</p>
                                </div>
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Dominant Theme</h4>
                                    <p className="text-2xl font-bold text-indigo-600">{topics[0]?.topic || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Emerging Trend</h4>
                                    <p className="text-2xl font-bold text-green-600">Refunds (+15%)</p>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Topic Name</th>
                                            <th className="px-6 py-3 text-right">Volume</th>
                                            <th className="px-6 py-3 text-right">Growth (7d)</th>
                                            <th className="px-6 py-3 text-right">Sentiment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {topics.map((t, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-bold text-slate-700">{t.topic}</td>
                                                <td className="px-6 py-4 text-right font-mono">{t.count}</td>
                                                <td className="px-6 py-4 text-right text-green-600 font-medium">+{Math.floor(Math.random() * 20)}%</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Positive
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-orange-50 border border-orange-200 rounded p-4 flex items-start gap-3">
                                <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-orange-800 text-sm">Action Required</h4>
                                    <p className="text-xs text-orange-700 mt-1">These queries received a low-confidence score or triggered a fallback response. Add content to the Knowledge Base to resolve them.</p>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">User Query</th>
                                            <th className="px-6 py-3">Date Detected</th>
                                            <th className="px-6 py-3">Frequency</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {unanswered.map((q, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-slate-800 font-medium">{q.query}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(q.last_asked).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{q.count} times</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setDetailsModal(null);
                                                            if(onChangeView) onChangeView(ViewState.KNOWLEDGE);
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                    >
                                                        Upload Solution
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {unanswered.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-500">No pending action items.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end">
                    <button 
                        onClick={() => setDetailsModal(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* 1. Header Actions & Status */}
      <div className="flex justify-between items-center mb-2">
         <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-slate-800">Performance Overview</h1>
             {/* Status Badge */}
             {connectionStatus === 'connected' ? (
                 <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold">
                     <Wifi className="w-3 h-3" /> Live Data
                 </span>
             ) : (
                 <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold" title="Backend unreachable. Showing demo data.">
                     <WifiOff className="w-3 h-3" /> Demo Mode
                 </span>
             )}
         </div>

         <div className="flex space-x-2">
            <button className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors">
                Last 30 Days
            </button>
            <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors">
                <Download className="w-4 h-4" /> Export Report
            </button>
         </div>
      </div>

      {/* 2. KPI Grid (Compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
            title="Total Interactions" 
            value={stats.totalRequests.toLocaleString()} 
            subtext="+12% vs last period" 
            trend="up"
            icon={MessageSquare}
            tooltip="Total number of messages processed by the RAG engine across all channels."
        />
        <KpiCard 
            title="Avg Latency" 
            value={`${stats.avgLatency}ms`} 
            subtext="Optimal range (<300ms)" 
            trend="neutral"
            icon={Activity} 
            tooltip="Average time taken to generate a response (Retrieval + Generation)."
        />
        <KpiCard 
            title="Est. Cost" 
            value={`$${stats.estimatedCost?.toFixed(2)}`} 
            subtext="Based on consumption" 
            trend="up"
            icon={DollarSign}
            tooltip="Estimated API cost based on Gemini 1.5 Flash pricing ($0.35/1M output tokens)."
        />
         <KpiCard 
            title="Retention Rate" 
            value={`${stats.semantic?.retentionRate}%`} 
            subtext="+2.4% engagement" 
            trend="up"
            icon={Users}
            tooltip="Percentage of users who return to ask a second question within 24 hours."
        />
      </div>

      {/* 3. Main Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
         {/* Token Usage - Main Chart */}
         <div className="lg:col-span-2 bg-white rounded-md border border-slate-300 shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-md">
                <h4 className="font-bold text-slate-700 text-sm">Token Consumption History</h4>
                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" />
            </div>
            <div className="flex-1 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tokenData} stackOffset="sign" barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" hide />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{fill: '#f1f5f9'}}
                        />
                        <Bar dataKey="Input" stackId="a" fill="#3b82f6" name="Input Tokens" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Output" stackId="a" fill="#10b981" name="Output Tokens" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Sentiment Donut */}
         <div className="bg-white rounded-md border border-slate-300 shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-md">
                <h4 className="font-bold text-slate-700 text-sm">User Sentiment</h4>
                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600" />
            </div>
            <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-3xl font-bold text-slate-800">89%</span>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Positive</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                        data={sentimentData} 
                        innerRadius={65} 
                        outerRadius={85} 
                        paddingAngle={3} 
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                        >
                        {sentimentData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs mt-2">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Positive
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Neutral
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Negative
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* 4. Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          {/* Trending Topics */}
          <div className="bg-white rounded-md border border-slate-300 shadow-sm flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-md flex justify-between items-center">
                <h4 className="font-bold text-slate-700 text-sm">Trending Topics</h4>
                <button 
                    onClick={() => setDetailsModal('topics')}
                    className="text-slate-400 hover:text-indigo-600 transition-colors" 
                    title="View Details"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2 text-xs uppercase tracking-wider">Topic Name</th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-wider">Volume</th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-wider">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {topics.slice(0, 4).map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-slate-700">{t.topic}</td>
                                <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{t.count}</td>
                                <td className="px-4 py-2.5 text-right">
                                    <div className="inline-block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-slate-200 p-2 text-center bg-slate-50 rounded-b-md">
                <button 
                    onClick={() => setDetailsModal('topics')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 w-full"
                >
                    View Full Report <ChevronRight className="w-3 h-3" />
                </button>
            </div>
          </div>

          {/* Action Items (Unanswered) - IMPROVED UX */}
          <div className="bg-white rounded-md border border-slate-300 shadow-sm flex flex-col border-l-4 border-l-orange-400 h-full">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-md flex justify-between items-center">
                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Action Items (Unanswered)
                </h4>
                <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold border border-orange-200">
                        {unanswered.length} Pending
                    </span>
                    <button 
                        onClick={() => setDetailsModal('actions')}
                        className="text-slate-400 hover:text-indigo-600 transition-colors" 
                        title="View Details"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-0 overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2 text-xs uppercase tracking-wider">Query</th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unanswered.slice(0, 3).map((q, idx) => (
                            <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                                <td className="px-4 py-2.5 text-slate-700 truncate max-w-[180px]" title={q.query}>
                                    {q.query}
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-500 text-xs font-mono">
                                    {new Date(q.last_asked).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <button 
                                        onClick={() => onChangeView && onChangeView(ViewState.KNOWLEDGE)}
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 hover:border-indigo-400 bg-indigo-50 px-2 py-1 rounded transition-all"
                                    >
                                        <PlusCircle className="w-3 h-3" /> Add Doc
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {unanswered.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 mb-2 opacity-20" />
                                        <p>All clear! No unanswered questions.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-slate-200 p-2 text-center bg-slate-50 rounded-b-md">
                <button 
                    onClick={() => setDetailsModal('actions')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center justify-center gap-1 w-full"
                >
                    View Full List <ChevronRight className="w-3 h-3" />
                </button>
            </div>
          </div>
      </div>
      
      {/* RENDER MODALS */}
      {renderDetailsModal()}

    </div>
  );
};

export default Dashboard;