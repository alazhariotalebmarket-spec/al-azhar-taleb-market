import React, { useMemo, useState } from 'react';

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  centerLabel: string;
  centerValue: string;
  segments: DonutSegment[];
  size?: 'md' | 'sm';
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  centerLabel,
  centerValue,
  segments,
  size = 'md',
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const total = useMemo(
    () => segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0),
    [segments]
  );

  const positiveCount = useMemo(
    () => segments.filter((seg) => seg.value > 0).length,
    [segments]
  );

  const activeSegment = useMemo(() => {
    if (!selectedKey) return null;
    return segments.find((s) => s.key === selectedKey) || null;
  }, [segments, selectedKey]);

  const viewSize = 220;
  const center = viewSize / 2;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const baseStroke = size === 'sm' ? 24 : 28;
  const activeStroke = size === 'sm' ? 30 : 34;

  const computedArcs = useMemo(() => {
    let cumulative = 0;
    return segments.map((seg) => {
      const safeVal = Math.max(0, seg.value);
      const pct = total > 0 ? (safeVal / total) * 100 : 0;
      const dashLen = total > 0 ? (safeVal / total) * circumference : 0;
      const gap = positiveCount > 1 && dashLen > 4 ? 2.5 : 0;
      const arc = {
        ...seg,
        pct,
        dashArray: `${Math.max(0, dashLen - gap)} ${circumference}`,
        dashOffset: -cumulative,
      };
      cumulative += dashLen;
      return arc;
    });
  }, [segments, total, circumference, positiveCount]);

  const handleToggleSegment = (key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  const activePct = activeSegment
    ? total > 0
      ? (Math.max(0, activeSegment.value) / total) * 100
      : 0
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <p className="text-xs text-slate-500">
          শতাংশ (%) দেখতে গ্রাফে ক্লিক বা টাচ করুন
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5">
        {/* Centered Round Shape Donut Graph */}
        <div
          className={`relative shrink-0 touch-manipulation ${
            size === 'sm' ? 'h-44 w-44 sm:h-48 sm:w-48' : 'h-56 w-56 sm:h-64 sm:w-64'
          }`}
        >
          <svg
            viewBox={`0 0 ${viewSize} ${viewSize}`}
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={title}
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={baseStroke}
            />

            <g transform={`rotate(-90 ${center} ${center})`}>
              {total > 0 &&
                computedArcs.map((arc) => {
                  if (arc.value <= 0) return null;
                  const isSelected = selectedKey === arc.key;
                  const isDimmed = selectedKey !== null && !isSelected;

                  return (
                    <circle
                      key={arc.key}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={isSelected ? activeStroke : baseStroke}
                      strokeDasharray={arc.dashArray}
                      strokeDashoffset={arc.dashOffset}
                      opacity={isDimmed ? 0.35 : 1}
                      className="cursor-pointer transition-all duration-200 outline-none"
                      role="button"
                      tabIndex={0}
                      aria-label={`${arc.label}: ${arc.formattedValue} (${arc.pct.toFixed(1)}%)`}
                      onClick={() => handleToggleSegment(arc.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleSegment(arc.key);
                        }
                      }}
                    />
                  );
                })}
            </g>
          </svg>

          {/* Center Always Displays Big Current Balance / Primary Total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="text-[11px] font-medium text-slate-500">{centerLabel}</span>
            <span
              className={`mt-0.5 font-mono-num font-bold text-slate-900 ${
                size === 'sm' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              {centerValue}
            </span>
            {activeSegment && (
              <span
                className="mt-1 font-mono-num text-xs font-bold"
                style={{ color: activeSegment.color }}
              >
                {activeSegment.label}: {activePct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Selected Slice Percentage Banner (Shown on Click/Touch) */}
        {activeSegment && (
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <span
                className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: activeSegment.color }}
              />
              {activeSegment.label}
            </span>
            <span className="font-mono-num font-bold text-slate-900">
              {activePct.toFixed(1)}% ({activeSegment.formattedValue})
            </span>
          </div>
        )}

        {/* Small Summary Legend Directly Below the Graph */}
        <div className="w-full max-w-md divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {computedArcs.map((seg) => {
            const isSelected = selectedKey === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => handleToggleSegment(seg.key)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs transition-colors ${
                  isSelected ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50/80'
                }`}
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.label}:</span>
                </span>
                <span className="font-mono-num text-slate-900 whitespace-nowrap">
                  <span className="font-semibold">{seg.formattedValue}</span>
                  <span className="ml-1.5 text-slate-500">({seg.pct.toFixed(1)}%)</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
