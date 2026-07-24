import { useState, useEffect } from 'react';
import { getTeamMembers, sendInvite, updateMemberRole, removeMember } from '../services/database';
import { useTeamRole } from '../hooks/useTeamRole';
import { HeaderBar } from './HeaderBar';
import type { TeamMember } from '../services/database';

interface TeamProps {
  teamId: string;
  onBack: () => void;
  onLogout: () => void;
}

export function Team({ teamId, onBack, onLogout }: TeamProps) {
  const { canInvite, canManageMembers } = useTeamRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'upload_only'>('upload_only');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [teamId]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamMembers(teamId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSendingInvite(true);
    setError(null);
    setInviteSuccess(false);

    try {
      await sendInvite(teamId, inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'owner' | 'upload_only') => {
    try {
      await updateMemberRole(memberId, newRole);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember(memberId);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="upload-container">
      <HeaderBar onBack={onBack} onLogout={onLogout} />

      <div className="upload-content">
        <h1 className="upload-title">Team Management</h1>

        {error && <div className="settings-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading team members...</div>
        ) : (
          <>
            <div className="team-members-list">
              <h2 className="team-section-title">Team Members</h2>
              {members.length === 0 ? (
                <p className="team-empty">No team members yet</p>
              ) : (
                <div className="team-members">
                  {members.map((member) => (
                    <div key={member.id} className="team-member glass-panel">
                      <div className="team-member-info">
                        <div className="team-member-email">{member.email}</div>
                        <div className="team-member-role">
                          {member.role === 'owner' ? 'Owner' : 'Upload Only'}
                        </div>
                      </div>
                      {canManageMembers && (
                        <div className="team-member-actions">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as 'owner' | 'upload_only')}
                            className="team-role-select"
                          >
                            <option value="owner">Owner</option>
                            <option value="upload_only">Upload Only</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canInvite && (
              <div className="team-invite-section">
                <h2 className="team-section-title">Invite Member</h2>
                <form onSubmit={handleSendInvite} className="team-invite-form">
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <input
                      type="email"
                      className="field-input"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Role</label>
                    <select
                      className="field-input"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'owner' | 'upload_only')}
                    >
                      <option value="upload_only">Upload Only</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingInvite || !inviteEmail}
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite'}
                  </button>
                </form>
                {inviteSuccess && (
                  <div className="team-invite-success">Invite sent successfully!</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
