import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

export interface AnimatedMetricTickerProps {
  value: number;
  startValue?: number;
  decimalPlaces?: number;
  suffixText?: string;
  className?: string;
}

/**
 * Component hiển thị số liệu KPI chuyển động mượt theo kỹ thuật Zero-Re-Render
 * học từ magicuidesign/magicui (number-ticker.tsx):
 * cập nhật trực tiếp ref.current.textContent qua framer-motion useSpring + tabular-nums.
 */
export const AnimatedMetricTicker: React.FC<AnimatedMetricTickerProps> = ({
  value,
  startValue = 0,
  decimalPlaces = 0,
  suffixText = '',
  className = '',
}) => {
  const numberRef = useRef<HTMLSpanElement | null>(null);
  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, {
    damping: 55,
    stiffness: 140,
  });
  const isInView = useInView(numberRef, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (numberRef.current) {
        const formatted = Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(latest.toFixed(decimalPlaces)));
        numberRef.current.textContent = `${formatted}${suffixText}`;
      }
    });
    return () => unsubscribe();
  }, [springValue, decimalPlaces, suffixText]);

  return (
    <span ref={numberRef} className={`inline-block tabular-nums ${className}`}>
      {startValue}
      {suffixText}
    </span>
  );
};
