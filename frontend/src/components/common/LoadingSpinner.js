import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'primary' }) {
  const sizes = { sm: '1rem', md: '2rem', lg: '3rem' };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `3px solid var(--color-border)`,
          borderTopColor: `var(--color-${color})`,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}
