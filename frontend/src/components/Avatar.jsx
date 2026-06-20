/* EcoRise — Avatar component (photo + initials fallback + optional ring/glow) */
import { useState } from 'react';

export default function Avatar({ src, name = '?', size = 44, ring, glow, style }) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const border = ring ? `2.5px solid ${ring}` : 'none';
  const box = glow ? `0 8px 18px ${ring || 'rgba(46,125,79,.22)'}` : 'none';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border, boxShadow: box, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg,#DDE8DE,#75B77B)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      {!err && src
        ? <img src={src} alt="" loading="lazy" onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size * .38, color: 'var(--green-d)' }}>{initials}</span>}
    </div>
  );
}
