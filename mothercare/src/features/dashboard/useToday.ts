import { useEffect, useState } from 'react';
import { todayInZone, type ISODate } from '../../lib/dates';

/** Today's date in the user's time zone; re-checked every minute so it rolls over at midnight. */
export function useToday(timeZone?: string): ISODate {
  const [today, setToday] = useState<ISODate>(() => todayInZone(new Date(), timeZone));
  useEffect(() => {
    const update = () => setToday(todayInZone(new Date(), timeZone));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return today;
}
