import { useState, useEffect } from 'react';

export type TeamRole = 'owner' | 'upload_only';

export function useTeamRole() {
  const [role, setRole] = useState<TeamRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load role from localStorage
    const savedRole = localStorage.getItem('teamRole') as TeamRole | null;
    if (savedRole) {
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  const setTeamRole = (newRole: TeamRole) => {
    setRole(newRole);
    localStorage.setItem('teamRole', newRole);
  };

  const clearTeamRole = () => {
    setRole(null);
    localStorage.removeItem('teamRole');
  };

  const isOwner = role === 'owner';
  const isUploadOnly = role === 'upload_only';
  const canEdit = isOwner;
  const canDelete = isOwner;
  const canConfirm = isOwner;
  const canInvite = isOwner;
  const canManageMembers = isOwner;

  return {
    role,
    loading,
    setTeamRole,
    clearTeamRole,
    isOwner,
    isUploadOnly,
    canEdit,
    canDelete,
    canConfirm,
    canInvite,
    canManageMembers,
  };
}
