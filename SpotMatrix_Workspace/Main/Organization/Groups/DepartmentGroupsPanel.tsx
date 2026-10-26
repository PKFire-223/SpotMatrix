import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  Search,
  X,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import {
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  UserTrustProfileItem,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface DepartmentGroupsPanelProps {
  parentDepartment: OrganizationDepartmentItem;
  groupsList: OrganizationGroupItem[];
  allMembers: UserTrustProfileItem[];
  userEmail: string;
  userRole: UserRoleType;
  isDark: boolean;
  onOpenCreateGroupForDept: (departmentName: string) => void;
  onOpenEditGroup: (group: OrganizationGroupItem) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroupMember: (groupId: string, targetUserEmail: string) => void;
}

export const DepartmentGroupsPanel: React.FC<DepartmentGroupsPanelProps> = ({
  parentDepartment,
  groupsList,
  allMembers,
  userEmail,
  userRole,
  isDark,
  onOpenCreateGroupForDept,
  onOpenEditGroup,
  onDeleteGroup,
  onToggleGroupMember,
}) => {
  const isSysAdmin = userRole === 'SYS_ADMIN';
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [activeAddMemberGroupId, setActiveAddMemberGroupId] = useState<
    string | null
  >(null);
  const [memberModalSearch, setMemberModalSearch] = useState<string>('');

  // Lọc danh sách nhóm con thuộc đúng Phòng ban đang chọn + quyền hiển thị theo Role
  const departmentGroups = useMemo(() => {
    const q = groupSearchQuery.trim().toLowerCase();
    return groupsList.filter((g: OrganizationGroupItem) => {
      const sameDept =
        g.departmentName.trim().toLowerCase() ===
        parentDepartment.departmentName.trim().toLowerCase();
      if (!sameDept) return false;

      // Nhân viên và Quản lý chỉ nhìn thấy nhóm mình đang tham gia; Admin thấy toàn bộ nhóm
      if (!isSysAdmin) {
        const isMyGroup =
          g.memberEmails.some(
            (em: string) =>
              em.trim().toLowerCase() === userEmail.trim().toLowerCase()
          ) ||
          g.leaderEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
        if (!isMyGroup) return false;
      }

      if (!q) return true;
      return (
        g.groupName.toLowerCase().includes(q) ||
        g.groupCode.toLowerCase().includes(q) ||
        g.projectTag.toLowerCase().includes(q) ||
        g.leaderName.toLowerCase().includes(q)
      );
    });
  }, [
    groupsList,
    parentDepartment.departmentName,
    isSysAdmin,
    userEmail,
    groupSearchQuery,
  ]);

  // Quy tắc ẩn Admin: Role khác không nhìn thấy tài khoản SYS_ADMIN trong danh sách
  const visibleMembersForRole = useMemo(() => {
    return allMembers.filter(
      (m: UserTrustProfileItem) => isSysAdmin || m.role !== 'SYS_ADMIN'
    );
  }, [allMembers, isSysAdmin]);

  const activeModalGroup = useMemo(() => {
    if (!activeAddMemberGroupId) return null;
    return (
      groupsList.find(
        (g: OrganizationGroupItem) => g.groupId === activeAddMemberGroupId
      ) || null
    );
  }, [groupsList, activeAddMemberGroupId]);

  const filteredModalCandidates = useMemo(() => {
    const q = memberModalSearch.trim().toLowerCase();
    return visibleMembersForRole.filter((m: UserTrustProfileItem) => {
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.userEmail.toLowerCase().includes(q) ||
        m.departmentName.toLowerCase().includes(q)
      );
    });
  }, [visibleMembersForRole, memberModalSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Các Nhóm Chuyên biệt trực thuộc Phòng ban “
            {parentDepartment.departmentName}” ({departmentGroups.length})
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nhóm là đơn vị con của Phòng ban • Thành viên trong cùng 1 Phòng ban
            có thể tham gia 1 hoặc nhiều Nhóm, nhưng không chung Nhóm với người
            khác Phòng ban.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              placeholder="Tìm tên nhóm, mã nhóm..."
              className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            {groupSearchQuery && (
              <button
                type="button"
                onClick={() => setGroupSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isSysAdmin && (
            <button
              type="button"
              onClick={() =>
                onOpenCreateGroupForDept(parentDepartment.departmentName)
              }
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Nhóm Con Mới</span>
            </button>
          )}
        </div>
      </div>

      {departmentGroups.length === 0 ? (
        <div
          className={`p-6 rounded-2xl border border-dashed text-center text-xs text-slate-400 ${
            isDark
              ? 'border-slate-800 bg-slate-950/40'
              : 'border-slate-200 bg-slate-50/60'
          }`}
        >
          Hiện chưa có nhóm chuyên môn nào hiển thị trong phòng ban “
          {parentDepartment.departmentName}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departmentGroups.map((grp: OrganizationGroupItem) => {
            // Lọc thành viên trong nhóm thuộc đúng phòng ban và tuân thủ quy tắc ẩn Admin với role khác
            const groupMembers = visibleMembersForRole.filter(
              (m: UserTrustProfileItem) =>
                grp.memberEmails.some(
                  (em: string) =>
                    em.trim().toLowerCase() === m.userEmail.trim().toLowerCase()
                )
            );

            return (
              <div
                key={grp.groupId}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-50/90 border-slate-200/90'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-600 text-white">
                          {grp.groupCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                          {grp.projectTag}
                        </span>
                      </div>
                      <h5 className="text-sm font-extrabold mt-1.5">
                        {grp.groupName}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {grp.description}
                      </p>
                    </div>

                    {isSysAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenEditGroup(grp)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                          title="Chỉnh sửa Nhóm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGroup(grp.groupId)}
                          className="p-1.5 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                          title="Xóa Nhóm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400">
                      Trưởng nhóm phụ trách:
                    </span>
                    <strong className="text-teal-600 dark:text-teal-400">
                      {grp.leaderName}
                    </strong>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>
                        Thành viên trong nhóm ({groupMembers.length} người):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupMembers.length === 0 ? (
                        <span className="text-[11px] italic text-slate-400">
                          Chưa có thành viên
                        </span>
                      ) : (
                        groupMembers.map((mem: UserTrustProfileItem) => (
                          <span
                            key={mem.userEmail}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <Users className="w-3 h-3 text-teal-500" />
                            <span>{mem.fullName}</span>
                            <span className="text-[9px] opacity-60">
                              ({mem.role})
                            </span>
                            {isSysAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleGroupMember(
                                    grp.groupId,
                                    mem.userEmail
                                  )
                                }
                                className="ml-0.5 text-slate-400 hover:text-rose-500"
                                title="Gỡ khỏi nhóm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {isSysAdmin && (
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAddMemberGroupId(grp.groupId);
                        setMemberModalSearch('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600/15 hover:bg-teal-600 hover:text-white text-teal-600 dark:text-teal-300 text-xs font-extrabold flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Thêm / Quản lý Thành viên Nhóm</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CHỌN THÀNH VIÊN VÀO NHÓM CON (KIỂM TRA CÙNG PHÒNG BAN, LÀM XÁM NGƯỜI KHÁC PHÒNG BAN) */}
      {activeModalGroup && isSysAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black">
                  Chỉ định Thành viên vào Nhóm: {activeModalGroup.groupName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Phòng ban chủ quản:{' '}
                  <strong className="text-teal-500">
                    {activeModalGroup.departmentName}
                  </strong>{' '}
                  • Chỉ thành viên thuộc phòng ban này mới được vào nhóm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveAddMemberGroupId(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberModalSearch}
                onChange={(e) => setMemberModalSearch(e.target.value)}
                placeholder="Tìm kiếm nhân viên theo họ tên, email hoặc phòng ban..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredModalCandidates.map((candidate: UserTrustProfileItem) => {
                const isSameDept =
                  candidate.departmentName.trim().toLowerCase() ===
                  activeModalGroup.departmentName.trim().toLowerCase();
                const isAlreadyInGroup = activeModalGroup.memberEmails.some(
                  (em: string) =>
                    em.trim().toLowerCase() ===
                    candidate.userEmail.trim().toLowerCase()
                );

                // Nếu khác phòng ban -> Hiển thị chữ màu xám nhạt và khóa không cho thêm vào nhóm
                if (!isSameDept) {
                  return (
                    <div
                      key={candidate.userEmail}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 opacity-50 cursor-not-allowed select-none ${
                        isDark
                          ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">
                          {candidate.fullName} ({candidate.role})
                        </p>
                        <p className="text-[11px]">
                          {candidate.userEmail} • Đang thuộc phòng ban:{' '}
                          <strong>{candidate.departmentName}</strong>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-300/40 dark:bg-slate-800 text-slate-500 flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        Khác phòng ban • Không thể chỉ định
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={candidate.userEmail}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold">
                          {candidate.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-500">
                          {candidate.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {candidate.userEmail} • Cùng phòng ban (
                        {candidate.departmentName})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleGroupMember(
                          activeModalGroup.groupId,
                          candidate.userEmail
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 ${
                        isAlreadyInGroup
                          ? 'bg-teal-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isAlreadyInGroup ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã trong nhóm (Bấm để gỡ)</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Thêm vào nhóm</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAddMemberGroupId(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};