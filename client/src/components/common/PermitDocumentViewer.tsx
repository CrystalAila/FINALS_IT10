import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  ExternalLink,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Edit2,
  Save,
  Loader2,
  FileText,
  Move,
} from 'lucide-react';

export interface PermitDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string | null;
  title: string;
  subtitle?: string;
  permitIssueDate?: string | null;
  permitExpiryDate?: string | null;
  allowDateEditing?: boolean;
  onSaveDates?: (issueDate: string, expiryDate: string) => Promise<void>;
  extraActions?: React.ReactNode;
}

export const PermitDocumentViewer: React.FC<PermitDocumentViewerProps> = ({
  open,
  onClose,
  documentUrl,
  title,
  subtitle,
  permitIssueDate = null,
  permitExpiryDate = null,
  allowDateEditing = false,
  onSaveDates,
  extraActions,
}) => {
  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Date editing state
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [issueDateInput, setIssueDateInput] = useState('');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Sync dates when modal opens or props change
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsDragging(false);
      setIsEditingDates(false);

      const formatForInput = (d: string | null | undefined) => {
        if (!d) return '';
        try {
          const date = new Date(d);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setIssueDateInput(formatForInput(permitIssueDate));
      setExpiryDateInput(formatForInput(permitExpiryDate));
    }
  }, [open, permitIssueDate, permitExpiryDate]);

  // Determine if document is PDF
  const isPdf = useMemo(() => {
    if (!documentUrl) return false;
    return documentUrl.toLowerCase().split('?')[0].endsWith('.pdf');
  }, [documentUrl]);

  // Expiration Status Analysis
  const expirationStatus = useMemo(() => {
    const expDateStr = isEditingDates ? expiryDateInput : (permitExpiryDate || expiryDateInput);
    if (!expDateStr) {
      return {
        status: 'unknown',
        label: 'No Expiry Date Set',
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: 'No Expiry Date',
        description: 'Expiry date has not been recorded for this permit.',
        daysRemaining: null,
      };
    }

    const expiry = new Date(expDateStr);
    if (isNaN(expiry.getTime())) {
      return {
        status: 'unknown',
        label: 'Invalid Date',
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: 'Invalid Date',
        description: 'Invalid date format recorded.',
        daysRemaining: null,
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        status: 'expired',
        label: 'EXPIRED',
        colorClass: 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-300',
        badge: `Expired ${Math.abs(daysRemaining)} days ago`,
        description: `This permit expired on ${expiry.toLocaleDateString()}. Renewal is required.`,
        daysRemaining,
      };
    } else if (daysRemaining <= 30) {
      return {
        status: 'near_expiry',
        label: 'NEAR EXPIRY',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-300',
        badge: `Expiring in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`,
        description: `This permit will expire soon on ${expiry.toLocaleDateString()} (${daysRemaining} days left).`,
        daysRemaining,
      };
    } else {
      return {
        status: 'valid',
        label: 'ACTIVE & VALID',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badge: `Valid for ${daysRemaining} days`,
        description: `Permit is valid until ${expiry.toLocaleDateString()}.`,
        daysRemaining,
      };
    }
  }, [permitExpiryDate, expiryDateInput, isEditingDates]);

  // Zoom controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length === 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1 || e.touches.length === 0) return;
    setPosition({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  // Auto-calculate 1 Year validity from issue date
  const handleAutoYearValidity = () => {
    if (!issueDateInput) {
      const today = new Date().toISOString().split('T')[0];
      setIssueDateInput(today);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDateInput(nextYear.toISOString().split('T')[0]);
    } else {
      const issue = new Date(issueDateInput);
      if (!isNaN(issue.getTime())) {
        const nextYear = new Date(issue);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setExpiryDateInput(nextYear.toISOString().split('T')[0]);
      }
    }
  };

  // Save updated permit dates
  const handleSaveDates = async () => {
    if (!onSaveDates) return;
    setIsSavingDates(true);
    try {
      await onSaveDates(issueDateInput, expiryDateInput);
      setIsEditingDates(false);
    } catch {
      // toast handled by parent
    } finally {
      setIsSavingDates(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D96B27] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                Business Permit Document
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${expirationStatus.colorClass}`}
              >
                {expirationStatus.status === 'expired' && <XCircle className="h-3 w-3" />}
                {expirationStatus.status === 'near_expiry' && <AlertTriangle className="h-3 w-3" />}
                {expirationStatus.status === 'valid' && <CheckCircle className="h-3 w-3" />}
                {expirationStatus.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 truncate mt-0.5">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                title="Download or open original"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Original</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Warning Banner if Expired or Near Expiry */}
        {expirationStatus.status === 'expired' && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-pulse">
            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              <strong>Warning:</strong> This business permit is EXPIRED ({expirationStatus.badge}). Immediate renewal is required.
            </span>
          </div>
        )}
        {expirationStatus.status === 'near_expiry' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Attention:</strong> Business permit expires soon ({expirationStatus.badge}). Please prepare updated renewal documents.
            </span>
          </div>
        )}

        {/* Dates Bar (Date Issued & Date of Expiration) */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                <strong>Date Issued:</strong>{' '}
                <span className="font-semibold text-slate-800">
                  {issueDateInput ? new Date(issueDateInput).toLocaleDateString() : 'Not specified'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>
                <strong>Expiry Date:</strong>{' '}
                <span className="font-semibold text-slate-800">
                  {expiryDateInput ? new Date(expiryDateInput).toLocaleDateString() : 'Not specified'}
                </span>
              </span>
            </div>

            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${expirationStatus.colorClass}`}>
              {expirationStatus.badge}
            </span>
          </div>

          {allowDateEditing && onSaveDates && (
            <div>
              {!isEditingDates ? (
                <button
                  type="button"
                  onClick={() => setIsEditingDates(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D96B27] hover:underline cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Permit Dates
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 bg-orange-50/70 border border-orange-200 p-2 rounded-2xl">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Issued</label>
                    <input
                      type="date"
                      value={issueDateInput}
                      onChange={(e) => setIssueDateInput(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#D96B27]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Expires</label>
                    <input
                      type="date"
                      value={expiryDateInput}
                      onChange={(e) => setExpiryDateInput(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#D96B27]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoYearValidity}
                    className="self-end rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 transition"
                    title="Set Expiry to 1 year after Issued Date"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDates}
                    disabled={isSavingDates}
                    className="self-end inline-flex items-center gap-1 rounded-lg bg-[#D96B27] hover:bg-[#C55A1A] px-2.5 py-1 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    {isSavingDates ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDates(false)}
                    className="self-end text-xs text-slate-500 hover:text-slate-800 px-1 py-1"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Zoom & Pan Controls Toolbar */}
        {!isPdf && documentUrl && (
          <div className="bg-slate-900/90 text-white backdrop-blur-md border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-300">
                Zoom: {Math.round(scale * 100)}%
              </span>
              {rotation !== 0 && (
                <span className="text-[11px] font-mono text-amber-300">
                  • Rotated: {rotation}°
                </span>
              )}
              {scale > 1 && (
                <span className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <Move className="h-3 w-3" /> Click & drag to pan
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 font-medium transition text-[11px]"
                title="Reset zoom to 100%"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Document Canvas / Viewer Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className={`flex-1 relative overflow-hidden bg-slate-900/10 flex items-center justify-center min-h-[380px] max-h-[620px] select-none ${
            scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {documentUrl ? (
            isPdf ? (
              <div className="w-full h-full p-2 flex flex-col">
                <iframe
                  src={documentUrl}
                  className="w-full h-[520px] rounded-2xl border border-slate-200 bg-white shadow-sm"
                  title="Business Permit PDF Document"
                />
                <div className="mt-2 text-center text-xs text-slate-500">
                  Viewing PDF document. Use browser PDF controls or{' '}
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D96B27] font-semibold hover:underline"
                  >
                    open in new tab
                  </a>
                  .
                </div>
              </div>
            ) : (
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="flex items-center justify-center max-w-full max-h-full"
              >
                <img
                  src={documentUrl}
                  alt="Business Permit"
                  draggable={false}
                  className="max-h-[500px] max-w-full object-contain rounded-xl shadow-lg border border-slate-200/80 pointer-events-none"
                />
              </div>
            )
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <FileText className="h-12 w-12 mx-auto text-slate-300" />
              <p className="text-base font-semibold text-slate-600">No document uploaded</p>
              <p className="text-xs text-slate-400">The permit file has not been provided yet.</p>
            </div>
          )}

          {/* Hint Overlay for Pan */}
          {!isPdf && documentUrl && scale > 1 && (
            <div className="absolute left-4 bottom-4 pointer-events-none">
              <span className="rounded-full bg-slate-900/80 text-white backdrop-blur-sm px-3 py-1 text-[11px] font-medium shadow-md">
                ✋ Drag to pan zoomed document
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {extraActions}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermitDocumentViewer;
