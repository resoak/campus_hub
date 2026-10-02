import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, LogOut, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { courseService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Course, CourseMember, CourseRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || '操作失敗，請稍後再試。';
  }
  return error instanceof Error ? error.message : '操作失敗，請稍後再試。';
}

function roleLabel(role: CourseRole) {
  if (role === 'Owner') return 'Owner';
  if (role === 'TA') return 'TA';
  return 'Member';
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [course, setCourse] = useState<Course | null>(null);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'TA' | 'Member'>('Member');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const loadCourse = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [courseData, memberData] = await Promise.all([
        courseService.getById(id),
        courseService.getMembers(id),
      ]);
      setCourse(courseData);
      setMembers(memberData);
      setEditName(courseData.name);
      setEditDescription(courseData.description || '');
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadCourse(); }, [id]);

  const currentMember = useMemo(
    () => members.find((member) => member.userId === user?.id),
    [members, user?.id]
  );
  const currentRole = currentMember?.role;
  const canManageMembers = currentRole === 'Owner' || currentRole === 'TA';

  const handleUpdateCourse = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !course) return;
    setActionError(null);
    if (!editName.trim()) { setActionError('課程名稱不可空白。'); return; }
    setIsSaving(true);
    try {
      const updated = await courseService.update(id, {
        name: editName.trim(),
        description: editDescription,
      });
      setCourse(updated);
      setEditMode(false);
    } catch (updateError) {
      setActionError(getErrorMessage(updateError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setActionError(null);
    if (!newMemberId.trim()) { setActionError('請輸入使用者 ID。'); return; }
    setIsAddingMember(true);
    try {
      await courseService.addMember(id, { userId: newMemberId.trim(), role: newMemberRole });
      setNewMemberId('');
      setNewMemberRole('Member');
      setMembers(await courseService.getMembers(id));
    } catch (addError) {
      setActionError(getErrorMessage(addError));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (member: CourseMember, role: 'TA' | 'Member') => {
    if (!id || member.role === role) return;
    setActionError(null);
    try {
      await courseService.updateMemberRole(id, member.userId, { role });
      setMembers((current) => current.map((item) => item.userId === member.userId ? { ...item, role } : item));
    } catch (roleError) {
      setActionError(getErrorMessage(roleError));
    }
  };

  const handleRemoveMember = async (member: CourseMember) => {
    if (!id || !window.confirm(`確定要將 ${member.name} 移出課程嗎？`)) return;
    setActionError(null);
    try {
      await courseService.removeMember(id, member.userId);
      setMembers((current) => current.filter((item) => item.userId !== member.userId));
    } catch (removeError) {
      setActionError(getErrorMessage(removeError));
    }
  };

  const handleLeave = async () => {
    if (!id || !window.confirm('確定要退出這門課程嗎？')) return;
    setActionError(null);
    try {
      await courseService.leave(id);
      navigate('/courses');
    } catch (leaveError) {
      setActionError(getErrorMessage(leaveError));
    }
  };

  if (isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (error || !course) {
    return (
      <Card variant="outlined" className="border-red-200 dark:border-red-900">
        <p className="text-red-600 dark:text-red-400">{error || '找不到課程。'}</p>
        <Link to="/courses" className="mt-4 inline-block text-sm font-medium text-indigo-600">返回我的課程</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400">
        <ArrowLeft className="h-4 w-4" />返回我的課程
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{course.code}</span>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{course.description || '尚未設定課程說明。'}</p>
        </div>
        <div className="flex gap-2">
          {currentRole === 'Owner' && <Button variant="outline" onClick={() => setEditMode((value) => !value)}><Pencil className="h-4 w-4" />編輯課程</Button>}
          {currentRole && currentRole !== 'Owner' && <Button variant="danger" onClick={() => void handleLeave()}><LogOut className="h-4 w-4" />退出課程</Button>}
        </div>
      </div>

      {actionError && (
        <Card variant="outlined" className="border-red-200 dark:border-red-900 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
        </Card>
      )}

      {editMode && currentRole === 'Owner' && (
        <Card variant="outlined">
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">修改課程資訊</h2>
            <Input label="課程名稱" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={200} />
            <Textarea label="課程說明" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={1000} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>取消</Button>
              <Button type="submit" isLoading={isSaving}>儲存變更</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card variant="outlined">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><Users className="h-5 w-5" />課程成員</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">共 {members.length} 位成員</p>
            </div>
            {currentRole && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">你的角色：{roleLabel(currentRole)}</span>}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {members.map((member) => {
              const isSelf = member.userId === user?.id;
              const ownerCanManage = currentRole === 'Owner' && member.role !== 'Owner';
              const taCanManage = currentRole === 'TA' && member.role === 'Member';
              return (
                <div key={member.userId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      {isSelf && <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">你</span>}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{roleLabel(member.role)}</span>
                    </div>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    <p className="mt-1 text-xs text-gray-400">加入時間：{new Date(member.joinedAt).toLocaleString()}</p>
                  </div>

                  {(ownerCanManage || taCanManage) && (
                    <div className="flex items-center gap-2">
                      {ownerCanManage && (
                        <select
                          value={member.role}
                          onChange={(e) => void handleRoleChange(member, e.target.value as 'TA' | 'Member')}
                          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <option value="Member">Member</option>
                          <option value="TA">TA</option>
                        </select>
                      )}
                      <Button variant="danger" size="sm" onClick={() => void handleRemoveMember(member)}>
                        <Trash2 className="h-4 w-4" />移除
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          {canManageMembers && (
            <Card variant="outlined">
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"><UserPlus className="h-5 w-5" />新增成員</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">目前後端以 User ID 新增指定使用者。</p>
                </div>
                <Input label="使用者 ID" value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} placeholder="User GUID" />
                {currentRole === 'Owner' ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">角色</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as 'TA' | 'Member')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Member">Member</option>
                      <option value="TA">TA</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">TA 只能新增 Member。</p>
                )}
                <Button type="submit" className="w-full" isLoading={isAddingMember}>新增成員</Button>
              </form>
            </Card>
          )}

          <Card variant="outlined">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">課程資訊</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-gray-500 dark:text-gray-400">課程代碼</dt><dd className="font-medium text-gray-900 dark:text-white">{course.code}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">你的角色</dt><dd className="font-medium text-gray-900 dark:text-white">{currentRole ? roleLabel(currentRole) : '未知'}</dd></div>
              <div><dt className="text-gray-500 dark:text-gray-400">成員數</dt><dd className="font-medium text-gray-900 dark:text-white">{members.length}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
