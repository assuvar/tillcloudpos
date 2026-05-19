export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${weekday}, ${day} ${month} ${year}`;
};

export const formatTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (
  value: number | string | Date | null | undefined,
  type: 'ms' | 'mins' | 'hrs' | 'auto' = 'auto',
): string => {
  if (value === null || value === undefined || value === '') return '-';

  let totalMins = 0;

  if (type === 'auto') {
    if (value instanceof Date || (typeof value === 'string' && isNaN(Number(value)) && !isNaN(Date.parse(value)))) {
      const msDiff = Date.now() - new Date(value).getTime();
      totalMins = Math.floor(Math.max(0, msDiff) / 60000);
    } else {
      const num = Number(value);
      if (isNaN(num)) return '-';
      if (num > 10000000) {
        // Milliseconds (likely long timestamps or large millisecond offsets)
        totalMins = Math.floor(num / 60000);
      } else if (num % 1 !== 0 || (num > 0 && num < 24)) {
        // Likely fractional hours
        totalMins = Math.round(num * 60);
      } else {
        // Likely minutes
        totalMins = Math.round(num);
      }
    }
  } else if (type === 'ms') {
    const num = Number(value);
    if (isNaN(num)) return '-';
    totalMins = Math.floor(num / 60000);
  } else if (type === 'mins') {
    const num = Number(value);
    if (isNaN(num)) return '-';
    totalMins = Math.round(num);
  } else if (type === 'hrs') {
    const num = Number(value);
    if (isNaN(num)) return '-';
    totalMins = Math.round(num * 60);
  }

  if (totalMins < 60) {
    return `${totalMins} mins`;
  }
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const hrLabel = hrs === 1 ? 'hr' : 'hrs';
  return `${hrs} ${hrLabel} ${mins} mins`;
};
