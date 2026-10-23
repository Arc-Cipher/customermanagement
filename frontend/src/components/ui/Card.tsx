import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  /** Set true when the card contains an absolutely-positioned dropdown that
   *  must not be clipped by the card boundary (e.g. autocomplete lists). */
  overflowVisible?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-6',
  headerClassName = 'px-6 py-4 border-b border-gray-100',
  overflowVisible = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${
        overflowVisible ? 'overflow-visible' : 'overflow-hidden'
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-700 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default Card;
