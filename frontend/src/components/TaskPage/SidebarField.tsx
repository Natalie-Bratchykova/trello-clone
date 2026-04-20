import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface SidebarFieldProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export default function SidebarField({ icon, label, children }: SidebarFieldProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

