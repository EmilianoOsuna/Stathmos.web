import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

// Colors
export const C_BLUE = "#60aebb";
export const C_RED = "#db3c1c";

export const Button = ({ children, onClick, disabled, variant = "primary", color, className = "", darkMode, ...props }) => {
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const vColor = color || (variant === "accent" ? C_RED : C_BLUE);

  const variants = {
    primary: {
      style: { backgroundColor: vColor, boxShadow: `0 4px 12px ${vColor}30` },
      className: "text-white hover:brightness-110 active:scale-[0.98]"
    },
    accent: {
      style: { backgroundColor: vColor, boxShadow: `0 4px 12px ${vColor}30` },
      className: "text-white hover:brightness-110 active:scale-[0.98]"
    },
    ghost: {
      style: {},
      className: darkMode 
        ? "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 bg-transparent" 
        : "border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 bg-transparent"
    },
    outline: {
      style: { borderColor: vColor, color: vColor },
      className: "border bg-transparent hover:bg-current hover:bg-opacity-[0.05] active:scale-[0.98]"
    }
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${v.className} ${className}`}
      style={{ ...v.style, ...props.style }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Icon = ({ name, className = "w-4 h-4" }) => {
  const icons = {
    calendar: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tool: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
      </svg>
    ),
    wrench: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
      </svg>
    ),
    car: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
    box: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    tag: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    receipt: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M16 8h-6" /><path d="M16 12H8" /><path d="M13 16H8" />
      </svg>
    ),
    shoppingcart: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    clipboard: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    scroll: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    chart: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    bell: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    checkcircle: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    dollar: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    creditcard: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    filetext: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    chevronDown: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    chevronUp: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
    search: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    history: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
      </svg>
    ),
    plus: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    printer: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    download: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    box: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
    car: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
    refresh: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
    bolt: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    lock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    check: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    x: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    circle: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export const Card = ({ darkMode, className = "", style = {}, children, ...props }) => (
  <div
    className={`rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"} ${className}`}
    style={{ boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.07)", ...style }}
    {...props}
  >
    {children}
  </div>
);

export const Field = ({ label, required, children, darkMode }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
      {label}{required && <span className="ml-0.5" style={{ color: C_RED }}>*</span>}
    </label>
    {children}
  </div>
);

const inputCls = (darkMode) =>
  `w-full rounded-md px-3 py-2 text-sm outline-none transition-colors border ${
    darkMode ? "bg-[#2a2a35] border-zinc-700 text-white placeholder-zinc-600" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
  }`;

export const Input = ({ darkMode, icon, ...props }) => (
  <div className="relative w-full">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon name={icon} className={`w-4 h-4 ${darkMode ? "text-zinc-500" : "text-gray-400"}`} />
      </div>
    )}
    <input {...props}
      className={`${inputCls(darkMode)} ${icon ? "pl-9" : ""} ${props.className || ""}`}
      onFocus={(e) => { e.target.style.borderColor = C_BLUE; props.onFocus?.(e); }}
      onBlur={(e)  => { e.target.style.borderColor = ""; props.onBlur?.(e); }}
    />
  </div>
);

export const Select = ({ darkMode, value, onChange, options = [], children, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const finalOptions = useMemo(() => {
    if (options.length > 0) return options;
    return React.Children.toArray(children)
      .filter(child => child && child.type === "option")
      .map(child => ({
        value: child.props.value,
        label: child.props.children
      }));
  }, [options, children]);

  const portalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inContainer = containerRef.current && containerRef.current.contains(event.target);
      const inPortal = portalRef.current && portalRef.current.contains(event.target);
      if (!inContainer && !inPortal) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX, 
        width: rect.width 
      });
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = finalOptions.find(opt => String(opt.value) === String(value));

  return (
    <div className={`relative w-full ${props.className || ""}`} ref={containerRef} style={props.style}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 rounded border cursor-pointer transition-all text-sm ${
          darkMode 
            ? "bg-[#2a2a35] border-zinc-700 text-white hover:border-zinc-500" 
            : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300"
        } ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}
      >
        <span className="truncate">{selectedOption?.label || "Seleccionar..."}</span>
        <Icon name="chevronDown" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={portalRef}
          className={`fixed z-[999] mt-1 rounded border shadow-xl overflow-hidden anim-fadeUp ${
            darkMode ? "bg-[#1e1e28] border-zinc-700 shadow-black/40" : "bg-white border-gray-200 shadow-gray-200/50"
          }`}
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {finalOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  String(opt.value) === String(value)
                    ? "bg-blue-600 text-white" 
                    : darkMode ? "text-zinc-300 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Modal = ({ open, onClose, title, subtitle, children, darkMode, maxWidth = "max-w-2xl" }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!open) return null;
  
  const bg = darkMode ? "bg-[#1e1e28]" : "bg-white";
  const border = darkMode ? "border-zinc-800" : "border-gray-200";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const textSub = darkMode ? "text-zinc-500" : "text-gray-400";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fadeIn" onClick={onClose}>
      <div 
        className={`w-full ${maxWidth} rounded-2xl shadow-2xl border ${bg} ${border} anim-fadeUp overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${border}`}>
          <div>
            <h3 className={`text-xl font-bold ${textTitle}`}>{title}</h3>
            {subtitle && <p className={`text-sm ${textSub} mt-1`}>{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-400"}`}
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ModuleHeader = ({ title, count, countLabel, action, darkMode }) => {
  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: darkMode ? "white" : "#111827" }}>{title}</h2>
        {count !== undefined && (
          <p className={`text-xs ${st} mt-0.5`}>{count} {countLabel || "registros"}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const Textarea = ({ darkMode, ...props }) => (
  <textarea {...props}
    className={`${inputCls(darkMode)} resize-none`}
    onFocus={(e) => (e.target.style.borderColor = C_BLUE)}
    onBlur={(e)  => (e.target.style.borderColor = "")}
  />
);

export const DatePicker = ({ value, onChange, isBlockedDate = () => false, darkMode, placeholder = "Seleccionar fecha..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + "T12:00:00") : new Date());
  const containerRef = useRef(null);
  const portalRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inContainer = containerRef.current && containerRef.current.contains(event.target);
      const inPortal = portalRef.current && portalRef.current.contains(event.target);
      if (!inContainer && !inPortal) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX, 
        width: rect.width 
      });
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString("es-MX", { month: "long", year: "numeric" });

  const shiftMonth = (dir) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + dir);
    setViewDate(next);
  };

  const handleSelect = (date) => {
    const key = ymd(date);
    if (isBlockedDate(key)) return;
    onChange(key);
    setIsOpen(false);
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 rounded border cursor-pointer transition-all text-sm ${
          darkMode 
            ? "bg-[#2a2a35] border-zinc-700 text-white hover:border-zinc-500" 
            : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300"
        } ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}
      >
        <span className={!value ? st : ""}>
          {value ? new Date(value + "T12:00:00").toLocaleDateString("es-MX", { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}
        </span>
        <Icon name="calendar" className={`w-4 h-4 ${darkMode ? "text-zinc-500" : "text-gray-400"}`} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={portalRef}
          className={`fixed z-[999] w-64 mt-1 rounded-xl border shadow-2xl p-3 anim-fadeUp ${
            darkMode ? "bg-[#1e1e28] border-zinc-700 shadow-black/50" : "bg-white border-gray-200 shadow-gray-200/50"
          }`}
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => shiftMonth(-1)} className={`p-1 rounded hover:bg-zinc-800/50 ${st}`}>←</button>
            <p className={`text-xs font-bold capitalize ${t}`}>{monthName}</p>
            <button onClick={() => shiftMonth(1)} className={`p-1 rounded hover:bg-zinc-800/50 ${st}`}>→</button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["D","L","M","M","J","V","S"].map(d => (
              <span key={d} className={`text-[10px] font-bold ${st}`}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={`e-${i}`} />;
              const key = ymd(d);
              const blocked = isBlockedDate(key);
              const active = key === value;
              const isToday = key === ymd(new Date());

              return (
                <button
                  key={key}
                  disabled={blocked}
                  onClick={() => handleSelect(d)}
                  className={`
                    h-8 rounded-lg text-xs transition-all
                    ${active ? "bg-blue-600 text-white" : blocked ? "opacity-20 cursor-not-allowed" : `${t} hover:bg-blue-600/20`}
                    ${isToday && !active ? "ring-1 ring-blue-500" : ""}
                  `}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Badge = ({ children, variant = "primary", className = "", darkMode }) => {
  const variants = {
    primary: darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-100",
    success: darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-100",
    danger: darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-100",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </span>
  );
};
