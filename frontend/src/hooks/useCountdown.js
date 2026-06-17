import { useEffect, useState } from 'react';

export default function useCountdown(targetMs) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let d = Math.max(0, targetMs - now);
  const days = Math.floor(d / 86400000); d -= days * 86400000;
  const hrs = Math.floor(d / 3600000); d -= hrs * 3600000;
  const mins = Math.floor(d / 60000); d -= mins * 60000;
  const secs = Math.floor(d / 1000);
  return { days, hrs, mins, secs };
}
