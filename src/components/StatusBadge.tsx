import React from 'react';

export type StatusType = 'info' | 'warning' | 'success' | 'danger';

interface StatusBadgeProps {
  status: StatusType;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function StatusBadge({ status, icon, label, className = '' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'info':
        return 'var(--color-primary)';
      case 'warning':
        return 'var(--color-accent)';
      case 'success':
        return 'var(--color-success)';
      case 'danger':
        return 'var(--color-danger)';
      default:
        return 'var(--color-primary)';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'info':
        return 'rgba(55, 138, 221, 0.15)';
      case 'warning':
        return 'rgba(239, 159, 39, 0.15)';
      case 'success':
        return 'rgba(29, 158, 117, 0.15)';
      case 'danger':
        return 'rgba(216, 90, 48, 0.15)';
      default:
        return 'rgba(55, 138, 221, 0.15)';
    }
  };

  return (
    <div
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        backgroundColor: getStatusBg(),
        border: `1px solid ${getStatusColor()}`,
        color: getStatusColor(),
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
