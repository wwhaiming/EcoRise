/* EcoRise — Avatar component (photo + initials fallback + optional ring/glow) */
import React, { useState } from 'react';

export default function Avatar({ src, name = '?', size = 44, ring, glow, style }) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const border = ring ? `2.5px solid ${ring}` : 'none';
  const box = glow ? `0 0 16px ${ring || 'rgba(0,230,118,.5)'}` : 'none';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border, boxShadow: box, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg,#3C3C68,#232342)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      {!err && src
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size * .38, color: '#fff' }}>{initials}</span>}
    </div>
  );
}
