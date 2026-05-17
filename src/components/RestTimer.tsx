import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface RestTimerProps {
  onDismiss: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ onDismiss }) => {
  const [elapsed, setElapsed] = useState(0); // milliseconds
  const startRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();

    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const totalMs = Math.floor(elapsed);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  return (
    <Box
      onClick={onDismiss}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1f1f1f, #242424)',
          border: '1px solid rgba(245,128,37,0.35)',
          borderRadius: 3,
          px: 2,
          py: 6,
          textAlign: 'center',
          boxShadow: '0 0 32px rgba(245,128,37,0.3)',
          userSelect: 'none',
          width: '80vw',
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontSize: '0.7rem' }}
        >
          Rest Timer
        </Typography>
        {/* 9 monospace chars (00:00.000) at ~0.6× width each → 14vw fills the 80vw card */}
        <Box
          sx={{
            fontFamily: 'monospace',
            fontSize: '14vw',
            fontWeight: 700,
            color: '#f58025',
            lineHeight: 1.1,
            mt: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {pad2(minutes)}:{pad2(seconds)}.{pad3(ms)}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.35)', mt: 2, display: 'block' }}
        >
          Tap anywhere to dismiss
        </Typography>
      </Box>
    </Box>
  );
};
