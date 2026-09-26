import { useEffect, useRef, useState } from 'react';

export const useSingleLineOverflow = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isOverflowing };
};
