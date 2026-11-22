import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  User, 
  Briefcase, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Clock, 
  Check, 
  X, 
  Filter, 
  RefreshCw,
  Phone,
  Mail,
  Video,
  FileText,
  Layers
} from 'lucide-react';
import { fetchTasks, createTask, updateTask, deleteTask, fetchDeals } from '../services/api';

const ACTIVITY_TYPES = ['Follow-up', 'Email', 'Meeting', 'Call', 'Note'];

export function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('Open'); // 'Open' | 'All' | 'Completed'
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    activity_type: 'Follow-up',
    deal_id: '',
    deal_name: '',
    owner_name: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Open',
  });

  // Load Tasks and Deals
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [tasksRes, dealsRes] = await Promise.all([
        fetchTasks(),
        fetchDeals()
      ]);

      if (tasksRes.data) {
        setTasks(tasksRes.data);
      }
      if (dealsRes.data) {
        setDeals(dealsRes.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = tasks.length;
    const openTasks = tasks.filter(t => t.status === 'Open');
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const pastDueTasks = openTasks.filter(t => t.is_past_due || t.isPastDue);
    const followUpsNeedAttention = openTasks.filter(t => 
      t.activity_type === 'Follow-up' || t.activityType === 'Follow-up' || t.is_past_due || t.isPastDue
    );

    return {
      total,
      open: openTasks.length,
      pastDue: pastDueTasks.length,
      completed: completedTasks.length,
      attention: followUpsNeedAttention.length,
    };
  }, [tasks]);

  // Unique Owners extracted from deals or tasks
  const availableOwners = useMemo(() => {
    const set = new Set();
    deals.forEach(d => {
      const rep = d.sales_rep || d.salesRep || d.sales_rep_rel?.name;
      if (rep) set.add(rep);
    });
    tasks.forEach(t => {
      const owner = t.owner_name || t.ownerName;
      if (owner) set.add(owner);
    });
    return Array.from(set).sort();
  }, [deals, tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status tab filter
      if (statusFilter === 'Open' && task.status !== 'Open') return false;
      if (statusFilter === 'Completed' && task.status !== 'Completed') return false;

      // Type filter
      const type = task.activity_type || task.activityType || 'Follow-up';
      if (typeFilter !== 'All' && type.toLowerCase() !== typeFilter.toLowerCase()) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const dealMatch = (task.deal_name || task.dealName || '').toLowerCase().includes(query);
        const ownerMatch = (task.owner_name || task.ownerName || '').toLowerCase().includes(query);
        if (!titleMatch && !dealMatch && !ownerMatch) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, typeFilter, searchQuery]);

  // Toggle Task Completion
  const handleToggleStatus = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === 'Open' ? 'Completed' : 'Open';

    // Optimistic UI Update
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: newStatus,
          is_past_due: newStatus === 'Open' ? t.is_past_due : false,
          isPastDue: newStatus === 'Open' ? t.isPastDue : false,
        };
      }
      return t;
    }));

    try {
      const res = await updateTask(task.id, { status: newStatus });
      if (!res.success) {
        // Revert on failure
        loadData();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
      loadData();
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      title: '',
      activity_type: 'Follow-up',
      deal_id: deals[0]?.id || '',
      deal_name: deals[0]?.name || '',
      owner_name: deals[0]?.sales_rep || deals[0]?.salesRep || 'Sarah Jenkins',
      due_date: tomorrow.toISOString().split('T')[0],
      status: 'Open',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      activity_type: task.activity_type || task.activityType || 'Follow-up',
      deal_id: task.deal_id || task.dealId || '',
      deal_name: task.deal_name || task.dealName || '',
      owner_name: task.owner_name || task.ownerName || '',
      due_date: task.due_date || task.dueDate || '',
      status: task.status || 'Open',
    });
    setIsModalOpen(true);
  };

  // Delete Task
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    // Optimistic removal
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await deleteTask(taskId);
      if (!res.success) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadData();
    }
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find deal name if deal_id is selected
      let dealName = formData.deal_name;
      let ownerName = formData.owner_name;
      if (formData.deal_id) {
        const matched = deals.find(d => d.id === formData.deal_id);
        if (matched) {
          dealName = matched.name;
          if (!ownerName) {
            ownerName = matched.sales_rep || matched.salesRep || '';
          }
        }
      }

      const payload = {
        title: formData.title.trim(),
        activity_type: formData.activity_type,
        deal_id: formData.deal_id || null,
        deal_name: dealName || null,
        owner_name: ownerName || null,
        due_date: formData.due_date || null,
        status: formData.status || 'Open',
      };

      if (editingTask) {
        const res = await updateTask(editingTask.id, payload);
        if (res.success && res.data) {
          setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to update task.');
        }
      } else {
        const res = await createTask(payload);
        if (res.success && res.data) {
          setTasks(prev => [res.data, ...prev]);
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to create task.');
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
      alert('An error occurred while saving the task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Type Badge
  const renderTypeBadge = (type) => {
    const t = (type || 'Follow-up').toLowerCase();
    switch (t) {
      case 'follow-up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f7f3ed] text-[#6b645c] border border-[#dcd1c1]">
            <RefreshCw className="w-2.5 h-2.5" />
            Follow-up
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e8f1f5] text-[#2b5b6c] border border-[#c0d8e2]">
            <Mail className="w-2.5 h-2.5" />
            Email
          </span>
        );
      case 'meeting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e2f2ee] text-[#115e4d] border border-[#b8e2d7]">
            <Video className="w-2.5 h-2.5" />
            Meeting
          </span>
        );
      case 'call':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#faefd4] text-[#8a5a00] border border-[#f2dda7]">
            <Phone className="w-2.5 h-2.5" />
            Call
          </span>
        );
      case 'note':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f7f3ed] text-[#6b645c] border border-[#dcd1c1]">
            <FileText className="w-2.5 h-2.5" />
            Note
          </span>
        );
    }
  };

  // Render Due Date Badge
  const renderDueDateBadge = (task) => {
    const dueDate = task.due_date || task.dueDate;
    const isPast = (task.is_past_due || task.isPastDue) && task.status === 'Open';

    if (!dueDate) {
      return (
        <span className="text-xs text-[#8c827a]">
          No due date
        </span>
      );
    }

    if (isPast) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#fae3e3] text-[#9e2a2b] border border-[#f5c6c6]">
          <AlertTriangle className="w-3 h-3 text-[#c86d51]" />
          <span>Past due ({dueDate})</span>
        </span>
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dueDate === todayStr && task.status === 'Open';

    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#faefd4] text-[#8a5a00] border border-[#f2dda7]">
          <Clock className="w-3 h-3 text-[#d99b26]" />
          <span>Due today</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#f7f3ed] text-[#6b645c] border border-[#dcd1c1]">
        <Calendar className="w-3 h-3 text-[#8c827a]" />
        <span>Due {dueDate}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#dcd1c1] bg-white text-xs text-[#6b645c] shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <span className="w-2 h-2 rounded-full bg-[#157f68] animate-pulse"></span>
          Loading TrueForecast tasks & activities from Neon PostgreSQL...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#dcd1c1]">
        <div>
          <p className="text-[10px] font-bold text-[#6b645c] uppercase tracking-wider mb-1">
            Selling with intention · {summary.open} open tasks
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1f1d1a]">
            Activities & next steps
          </h1>
          <p className="text-xs text-[#6b645c] mt-1">
            Track follow-ups, meetings, and key milestones across pipeline deals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-[#6b645c] hover:text-[#1f1d1a] hover:bg-[#f7f3ed] rounded-lg border border-[#dcd1c1] transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#c86d51] hover:bg-[#b35c42] rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add task</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Bar (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Open Tasks */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Open tasks</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {summary.open}
            </span>
            <span className="text-xs text-[#6b645c]">active</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Pending execution
          </p>
        </div>

        {/* Past Due */}
        <div className={`border rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)] ${
          summary.pastDue > 0 ? 'bg-[#fae3e3]/40 border-[#f5c6c6]' : 'bg-white border-[#dcd1c1]'
        }`}>
          <p className={`text-xs font-medium ${summary.pastDue > 0 ? 'text-[#9e2a2b]' : 'text-[#6b645c]'}`}>
            Past due
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold tabular-nums ${
              summary.pastDue > 0 ? 'text-[#9e2a2b]' : 'text-[#1f1d1a]'
            }`}>
              {summary.pastDue}
            </span>
            {summary.pastDue > 0 && (
              <span className="text-[10px] font-semibold text-[#9e2a2b] bg-[#fae3e3] px-1.5 py-0.5 rounded border border-[#f5c6c6]">
                Urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Overdue follow-ups
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Completed</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {summary.completed}
            </span>
            <span className="text-xs text-[#157f68] font-medium">done</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Closed out successfully
          </p>
        </div>

        {/* Follow-ups Need Attention */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Follow-ups need attention</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {summary.attention}
            </span>
            <span className="text-xs text-[#6b645c]">deals</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Next steps flagged
          </p>
        </div>
      </div>

      {/* 3. Activities List Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl shadow-[0_1px_3px_rgba(31,29,26,0.05)] overflow-hidden">
        {/* Controls Bar: Filter Tabs & Search */}
        <div className="p-4 border-b border-[#dcd1c1] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#f7f3ed] p-1 rounded-lg border border-[#dcd1c1] shrink-0">
            <button
              onClick={() => setStatusFilter('Open')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'Open'
                  ? 'bg-white text-[#1f1d1a] font-semibold shadow-xs'
                  : 'text-[#6b645c] hover:text-[#1f1d1a]'
              }`}
            >
              Open ({summary.open})
            </button>
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-white text-[#1f1d1a] font-semibold shadow-xs'
                  : 'text-[#6b645c] hover:text-[#1f1d1a]'
              }`}
            >
              All ({summary.total})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-white text-[#1f1d1a] font-semibold shadow-xs'
                  : 'text-[#6b645c] hover:text-[#1f1d1a]'
              }`}
            >
              Completed ({summary.completed})
            </button>
          </div>

          {/* Search & Type Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            {/* Activity Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-[#dcd1c1] bg-white text-[#1f1d1a] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] cursor-pointer"
            >
              <option value="All">All types</option>
              {ACTIVITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8c827a] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks or deals..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#dcd1c1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] placeholder:text-[#8c827a] text-[#1f1d1a]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c827a] hover:text-[#1f1d1a]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Items List */}
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#f7f3ed] border border-[#dcd1c1] flex items-center justify-center mx-auto text-[#8c827a] mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[#1f1d1a]">No tasks found</h4>
            <p className="text-xs text-[#6b645c] mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'All' || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'All clear! Create your first task to start tracking actionable deal follow-ups.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1f1d1a] bg-[#f7f3ed] hover:bg-white border border-[#dcd1c1] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create your first task</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#ebe3d7]">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              const dealName = task.deal_name || task.dealName || 'General task';
              const ownerName = task.owner_name || task.ownerName || 'Unassigned';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-[#f7f3ed] transition-colors group ${
                    isCompleted ? 'bg-[#f7f3ed]/40' : ''
                  }`}
                >
                  {/* Left: Circle Checkbox Toggle + Title + Badges */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={(e) => handleToggleStatus(task, e)}
                      className="mt-0.5 text-[#8c827a] hover:text-[#1f1d1a] transition-colors shrink-0 cursor-pointer"
                      title={isCompleted ? 'Mark as open' : 'Mark as completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#157f68] fill-[#e2f2ee]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#dcd1c1] group-hover:text-[#8c827a]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold tracking-tight transition-all ${
                          isCompleted
                            ? 'line-through text-[#8c827a]'
                            : 'text-[#1f1d1a]'
                        }`}>
                          {task.title}
                        </span>
                        {renderTypeBadge(task.activity_type || task.activityType)}
                      </div>

                      {/* Associated Deal and Owner */}
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#6b645c]">
                        <span className="inline-flex items-center gap-1 font-medium text-[#1f1d1a]">
                          <Briefcase className="w-3 h-3 text-[#8c827a]" />
                          {dealName}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-[#8c827a]" />
                          {ownerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Date Badge & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    {renderDueDateBadge(task)}

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEditModal(task, e)}
                        className="p-1.5 text-[#6b645c] hover:text-[#1f1d1a] hover:bg-white rounded border border-transparent hover:border-[#dcd1c1] transition-colors cursor-pointer"
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="p-1.5 text-[#6b645c] hover:text-[#9e2a2b] hover:bg-[#fae3e3] rounded border border-transparent hover:border-[#f5c6c6] transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1f1d1a]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#dcd1c1] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#dcd1c1] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1f1d1a]">
                  {editingTask ? 'Edit activity task' : 'Create new task'}
                </h3>
                <p className="text-xs text-[#6b645c] mt-0.5">
                  Keep deals on track with scheduled next steps
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8c827a] hover:text-[#1f1d1a] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                  Task title <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Follow up on proposal with CFO"
                  className="w-full px-3 py-2 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] placeholder:text-[#8c827a] text-[#1f1d1a]"
                />
              </div>

              {/* Activity Type & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                    Activity type
                  </label>
                  <select
                    value={formData.activity_type}
                    onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#dcd1c1] bg-[#f7f3ed] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] text-[#1f1d1a] cursor-pointer"
                  >
                    {ACTIVITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#dcd1c1] bg-[#f7f3ed] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] text-[#1f1d1a] cursor-pointer"
                  />
                </div>
              </div>

              {/* Related Deal */}
              <div>
                <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                  Related deal
                </label>
                <select
                  value={formData.deal_id}
                  onChange={(e) => {
                    const selectedDealId = e.target.value;
                    const selectedDeal = deals.find(d => d.id === selectedDealId);
                    setFormData({
                      ...formData,
                      deal_id: selectedDealId,
                      deal_name: selectedDeal ? selectedDeal.name : '',
                      owner_name: selectedDeal ? (selectedDeal.sales_rep || selectedDeal.salesRep || formData.owner_name) : formData.owner_name,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#dcd1c1] bg-[#f7f3ed] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] text-[#1f1d1a] cursor-pointer"
                >
                  <option value="">None / General pipeline task</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name} ({deal.stage || 'Discovery'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner / Assignee & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                    Assignee / Owner
                  </label>
                  <input
                    type="text"
                    list="owners-list"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-xs border border-[#dcd1c1] bg-[#f7f3ed] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] text-[#1f1d1a]"
                  />
                  <datalist id="owners-list">
                    {availableOwners.map(owner => (
                      <option key={owner} value={owner} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#dcd1c1] bg-[#f7f3ed] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] text-[#1f1d1a] cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#dcd1c1] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#6b645c] hover:text-[#1f1d1a] bg-white hover:bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#c86d51] hover:bg-[#b35c42] rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : (editingTask ? 'Save changes' : 'Create task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
