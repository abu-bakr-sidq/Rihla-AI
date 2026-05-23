/**
 * usePrayerTimes.js
 * Custom hook — fetches live Islamic prayer times from Aladhan API (free, no key).
 * Usage: const { times, hijriDate, loading } = usePrayerTimes(destination, dateStr)
 */
import { useState, useEffect } from 'react';

const fmt24to12 = (t) => {
  if (!t) return '--';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export function usePrayerTimes(destination, dateStr) {
  const [times, setTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let alive = true;
    setLoading(true);
    setError(false);

    // Build date suffix for Aladhan API: /DD-MM-YYYY
    let dateSuffix = '';
    if (dateStr && dateStr !== 'Unknown') {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        dateSuffix = `/${dd}-${mm}-${yyyy}`;
      }
    }

    const city = destination.split(',')[0].trim();
    const url = `https://api.aladhan.com/v1/timingsByCity${dateSuffix}?city=${encodeURIComponent(city)}&country=&method=2`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!alive) return;
        if (data?.data?.timings) {
          const t = data.data.timings;
          setTimes({
            Fajr:    fmt24to12(t.Fajr),
            Sunrise: fmt24to12(t.Sunrise),
            Dhuhr:   fmt24to12(t.Dhuhr),
            Asr:     fmt24to12(t.Asr),
            Maghrib: fmt24to12(t.Maghrib),
            Isha:    fmt24to12(t.Isha),
          });
          const hd = data.data.date?.hijri;
          if (hd) setHijriDate(`${hd.day} ${hd.month?.en} ${hd.year} AH`);
        } else {
          setError(true);
        }
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [destination, dateStr]);

  return { times, hijriDate, loading, error };
}
