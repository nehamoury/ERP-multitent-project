'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Loader2, Check, Users, Briefcase, Building2, User as UserIcon } from 'lucide-react';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  department: { name: string } | null;
}

const TABS = [
  { id: 'DIRECT', label: 'Direct', icon: UserIcon },
  { id: 'GROUP', label: 'Group', icon: Users },
  { id: 'PROJECT', label: 'Project', icon: Briefcase },
  { id: 'DEPARTMENT', label: 'Department', icon: Building2 },
] as const;

type TabType = typeof TABS[number]['id'];

export const NewChatDialog = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DIRECT');
  
  // Data states
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Fetch users when opened
  useEffect(() => {
    if (open && users.length === 0) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/chat/users');
          if (res.ok) setUsers(await res.json());
        } catch (error) {
          console.error("Failed to fetch users", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [open]);

  // Fetch projects
  useEffect(() => {
    if (activeTab === 'PROJECT' && projects.length === 0) {
      const fetchProjects = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/projects');
          if (res.ok) setProjects(await res.json());
        } catch (error) {
          console.error("Failed to fetch projects", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [activeTab]);

  // Fetch departments
  useEffect(() => {
    if (activeTab === 'DEPARTMENT' && departments.length === 0) {
      const fetchDepartments = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/organization/departments');
          if (res.ok) {
            const json = await res.json();
            if (json.success) setDepartments(json.data);
          }
        } catch (error) {
          console.error("Failed to fetch departments", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDepartments();
    }
  }, [activeTab]);

  // Reset form when modal closes or tab changes
  useEffect(() => {
    setSearch('');
    setSelectedUsers([]);
    setGroupName('');
  }, [open, activeTab]);

  const handleCreateChat = async (payload: any) => {
    setCreating(true);
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const room = await res.json();
        setOpen(false);
        router.push(`?room=${room.id}`);
      }
    } catch (error) {
      console.error("Failed to create chat", error);
    } finally {
      setCreating(false);
    }
  };

  const handleStartDirect = (userId: string) => {
    handleCreateChat({ type: 'DIRECT', participantIds: [userId] });
  };

  const handleStartGroup = () => {
    if (selectedUsers.length === 0 || !groupName.trim()) return;
    handleCreateChat({ type: 'GROUP', name: groupName, participantIds: selectedUsers });
  };

  const handleStartProject = (projectId: string) => {
    handleCreateChat({ type: 'PROJECT', projectId, participantIds: [] });
  };

  const handleStartDepartment = (departmentId: string) => {
    handleCreateChat({ type: 'DEPARTMENT', departmentId, participantIds: [] });
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors" title="New Chat">
          <Plus size={18} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mt-4 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all",
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Group Chat Extra Inputs */}
        {activeTab === 'GROUP' && (
          <div className="mt-4 space-y-3 shrink-0">
            <input
              placeholder="Enter Group Name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Select Members</span>
              <span>{selectedUsers.length} selected</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mt-4 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus={activeTab !== 'GROUP'}
            placeholder={`Search ${activeTab.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* List Content */}
        <div className="mt-4 flex-1 overflow-y-auto min-h-[300px] space-y-1 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* DIRECT CHAT LIST */}
              {activeTab === 'DIRECT' && (
                filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No employees found.</div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      disabled={creating}
                      onClick={() => handleStartDirect(user.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0", getAvatarColor(user.name))}>
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role} {user.department ? `• ${user.department.name}` : ''}</p>
                      </div>
                    </button>
                  ))
                )
              )}

              {/* GROUP CHAT LIST */}
              {activeTab === 'GROUP' && (
                filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No employees found.</div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      disabled={creating}
                      onClick={() => toggleUser(user.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border",
                        selectedUsers.includes(user.id) ? "bg-primary border-primary text-primary-foreground" : "border-input"
                      )}>
                        {selectedUsers.includes(user.id) && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 text-xs", getAvatarColor(user.name))}>
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                      </div>
                    </button>
                  ))
                )
              )}

              {/* PROJECT CHAT LIST */}
              {activeTab === 'PROJECT' && (
                filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No projects found.</div>
                ) : (
                  filteredProjects.map(project => (
                    <button
                      key={project.id}
                      disabled={creating}
                      onClick={() => handleStartProject(project.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left border mb-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{project.members?.length || 0} Members</p>
                      </div>
                    </button>
                  ))
                )
              )}

              {/* DEPARTMENT CHAT LIST */}
              {activeTab === 'DEPARTMENT' && (
                filteredDepartments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No departments found.</div>
                ) : (
                  filteredDepartments.map(dept => (
                    <button
                      key={dept.id}
                      disabled={creating}
                      onClick={() => handleStartDepartment(dept.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left border mb-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate text-sm">{dept.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{dept._count?.users || 0} Employees</p>
                      </div>
                    </button>
                  ))
                )
              )}
            </>
          )}
        </div>

        {/* Group Chat Submit Button */}
        {activeTab === 'GROUP' && (
          <div className="pt-4 border-t mt-auto shrink-0">
            <button
              disabled={creating || selectedUsers.length === 0 || !groupName.trim()}
              onClick={handleStartGroup}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group Chat'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
