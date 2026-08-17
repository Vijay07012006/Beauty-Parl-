'use client';

import React from 'react';

function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  return (
    <div className="space-y-1 mt-1">
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[strength]} transition-all duration-300`}
          style={{ width: `${((strength + 1) / 5) * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {labels[strength]} password
      </p>
    </div>
  );
}
