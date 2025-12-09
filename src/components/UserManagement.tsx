import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, MoreHorizontal, Mail, Shield, AlertCircle, CheckCircle2, X, Loader2, Trash2, Edit2, UserCheck, Power } from 'lucide-react';
import { ManagedUser } from '../types';
import { supabase } from '../services/supabaseClient';
import { API_URL } from '../services/config';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'user', status: 'active' });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        
        const response = await fetch(`${API_URL}/api/users`, {
             headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            setUsers(data);
        }
    } catch (e) {
        console.error("Failed to fetch users", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  const filteredUsers = users.filter(u => {
      const matchesSearch = 
        u.firstName.toLowerCase().includes(search.toLowerCase()) || 
        u.lastName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
  });

  // Modal Handlers
  const openAddModal = () => {
      setEditingUser(null);
      setFormData({ firstName: '', lastName: '', email: '', role: 'user', status: 'invited' });
      setIsModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
      setEditingUser(user);
      setFormData({ 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email, 
          role: user.role, 
          status: user.status 
      });
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = editingUser 
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`;
      
      const method = editingUser ? 'PUT' : 'POST';

      try {
          const res = await fetch(endpoint, {
              method,
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify(formData)
          });

          if (res.ok) {
              await fetchUsers(); // Refresh list immediately
              setIsModalOpen(false);
          } else {
              alert("Operation failed. Check server logs.");
          }
      } catch (e) {
          console.error(e);
          alert("Network error. Backend might be down.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to remove this user? This action cannot be undone.")) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      try {
          const res = await fetch(`${API_URL}/api/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${session?.access_token}` }
          });
          
          if (res.ok) {
            setUsers(prev => prev.filter(u => u.id !== id));
          } else {
              alert("Failed to delete user.");
          }
      } catch (e) {
          console.error("Delete failed", e);
      }
  };

  // Badge Components
  const RoleBadge = ({ role }: { role: string }) => {
      if (role === 'admin') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">Administrator</span>;
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">Standard User</span>;
  };

  const StatusBadge = ({ status }: { status: string }) => {
      if (status === 'active') return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>;
      if (status === 'invited') return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Invited</span>;
      return <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Suspended</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Actions */}
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Team Management
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage user access, roles, and invitations.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
          >
              <UserPlus className="w-4 h-4" /> Add User
          </button>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white rounded-md border border-slate-300 p-4 shadow-sm flex justify-between items-center">
          <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
              />
          </div>
          <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">Role:</span>
              <div className="flex bg-slate-100 rounded p-1">
                  {['all', 'admin', 'user'].map(role => (
                      <button 
                        key={role}
                        onClick={() => setFilterRole(role as any)}
                        className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors ${filterRole === role ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          {role}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* 3. User Table */}
      <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {loading ? (
                      <tr>
                          <td colSpan={5} className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td>
                      </tr>
                  ) : filteredUsers.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400">
                              <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p>No users found matching your filters.</p>
                          </td>
                      </tr>
                  ) : (
                      filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                                          {user.firstName.substring(0,2).toUpperCase()}
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                                          <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <RoleBadge role={user.role} />
                              </td>
                              <td className="px-6 py-4">
                                  <StatusBadge status={user.status} />
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                                  {new Date(user.lastActive).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit User">
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove User">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>Showing {filteredUsers.length} users</span>
              <span>All changes are logged in audit trail.</span>
          </div>
      </div>

      {/* 4. Edit/Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">{editingUser ? 'Edit User' : 'Invite New User'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">First Name</label>
                              <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Last Name</label>
                              <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                          <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} className={`w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none ${editingUser ? 'bg-slate-100 cursor-not-allowed' : ''}`} />
                      </div>
                      
                      {/* Role Selection */}
                      <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Role Assignment</label>
                          <div className="flex gap-4">
                              <label className={`flex-1 border rounded p-3 cursor-pointer transition-all ${formData.role === 'admin' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-slate-300 hover:bg-slate-50'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={() => setFormData({...formData, role: 'admin'})} className="text-purple-600 focus:ring-purple-500" />
                                      <span className="text-sm font-bold text-slate-800">Admin</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 ml-5">Full access.</p>
                              </label>
                              <label className={`flex-1 border rounded p-3 cursor-pointer transition-all ${formData.role === 'user' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-300 hover:bg-slate-50'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <input type="radio" name="role" value="user" checked={formData.role === 'user'} onChange={() => setFormData({...formData, role: 'user'})} className="text-blue-600 focus:ring-blue-500" />
                                      <span className="text-sm font-bold text-slate-800">User</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 ml-5">Standard access.</p>
                              </label>
                          </div>
                      </div>

                      {/* Status Selection (Only for Edit) */}
                      {editingUser && (
                          <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Account Status</label>
                              <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                              >
                                  <option value="active">Active</option>
                                  <option value="suspended">Suspended</option>
                                  <option value="invited">Invited</option>
                              </select>
                          </div>
                      )}

                      {!editingUser && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <p>An invitation email will be sent to the user with instructions to set their password.</p>
                          </div>
                      )}

                      <div className="pt-2 flex justify-end gap-3">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded text-sm font-bold hover:bg-slate-100">Cancel</button>
                          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2">
                              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                              {editingUser ? 'Save Changes' : 'Send Invitation'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default UserManagement;