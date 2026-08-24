import React, { useEffect, useRef, useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import type { AdminCanonicalImportRowDto } from 'shared/contracts';
import { api } from '../../lib/api';

interface AdminCanonicalImportProps {
  theme: ThemeColors;
}

const FileDocumentIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const AdminCanonicalImport: React.FC<AdminCanonicalImportProps> = ({ theme }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedRowCount, setImportedRowCount] = useState(0);
  const [rows, setRows] = useState<readonly AdminCanonicalImportRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRows(null);
      setError(null);
    }
  };

  const handleChooseClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setError(null);
    setImportProgress(0);

    try {
      const csvText = await selectedFile.text();
      const totalRows = Math.max(csvText.trim().split('\n').length - 1, 1);
      setImportedRowCount(totalRows);

      // The backend imports the whole file in one request (no per-row progress stream), so we
      // animate a believable progress bar sized to the row count and hold at 92% until the
      // response lands, then snap to 100% — the modal still blocks until the real result returns.
      const estimatedMs = Math.min(Math.max(totalRows * 25, 800), 15000);
      const stepMs = 120;
      const stepIncrement = (92 / (estimatedMs / stepMs));
      progressTimerRef.current = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + stepIncrement, 92));
      }, stepMs);

      const result = await api.admin.importCanonicalCsv(csvText);

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setImportProgress(100);
      setRows(result);
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setError(err instanceof Error ? err.message : 'Could not import this file right now.');
    } finally {
      // Brief pause on 100% so the admin sees completion before the blocking modal disappears.
      setTimeout(() => setIsImporting(false), 400);
    }
  };

  const errorRows = rows?.filter((r) => r.status === 'error' || r.status === 'failed' || r.status === 'rejected') ?? [];

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Blocking import progress modal — no close control, captures all clicks until finished */}
      {isImporting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: theme.surface,
              borderRadius: '20px',
              padding: '40px 36px',
              width: '420px',
              maxWidth: '90vw',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0' }}>
              Importing Scheme CSV…
            </h3>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: '0 0 24px 0' }}>
              Writing {importedRowCount.toLocaleString()} row{importedRowCount === 1 ? '' : 's'} to the database. Please don't close this window.
            </p>

            <div style={{ width: '100%', backgroundColor: theme.surfaceSubtle, height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${importProgress}%`,
                  backgroundColor: theme.primary,
                  transition: 'width 0.15s ease',
                  borderRadius: '6px',
                }}
              />
            </div>
            <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '800', color: theme.primary }}>
              {Math.round(importProgress)}%
            </div>
          </div>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: theme.textHeading, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          CSV Scheme Import
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Upload a CSV with the exact 27-column scheme schema — rows import directly as draft schemes, no manual review step
        </p>
      </div>

      {/* Main Upload Drop Box Card */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '20px',
          padding: '64px 32px',
          border: `2px dashed ${theme.border}`,
          maxWidth: '650px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: theme.textMuted }}>
          <FileDocumentIcon />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.textHeading, margin: '0 0 6px 0' }}>
          Select Scheme CSV File
        </h3>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 24px 0' }}>
          Header must match exactly: slug, scheme_name, short_title, level, state, ministry, department,
          beneficiary_type, target_beneficiaries, benefit_type, categories, sub_categories, tags,
          brief_description, detailed_description, benefits, eligibility, exclusions, application_mode,
          application_process, documents_required, references, scheme_open_date, scheme_close_date,
          dbt_scheme, faq_count, source_url
        </p>

        <button
          onClick={handleChooseClick}
          style={{
            backgroundColor: theme.primary,
            color: theme.textInverse,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <FolderIcon />
          <span>Choose CSV File</span>
        </button>

        {selectedFile && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textHeading }}>
              Selected File: <span style={{ color: theme.primary }}>{selectedFile.name}</span>
            </div>
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
              Size: {(selectedFile.size / 1024).toFixed(1)} KB
            </div>

            {error && (
              <div style={{ marginTop: '12px', color: theme.alertUrgent, fontSize: '13px', fontWeight: '600' }}>{error}</div>
            )}

            <button
              onClick={handleStartImport}
              disabled={isImporting}
              style={{
                marginTop: '16px',
                backgroundColor: rows ? theme.success : theme.primary,
                color: theme.textInverse,
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isImporting ? (
                'Importing...'
              ) : rows ? (
                <>
                  <CheckCircleIcon />
                  <span>Re-Import File</span>
                </>
              ) : (
                'Import CSV'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Per-row validation results */}
      {rows && (
        <div
          style={{
            marginTop: '28px',
            backgroundColor: theme.surface,
            borderRadius: '20px',
            border: `1.5px solid ${theme.border}`,
            overflow: 'hidden',
            maxWidth: '900px',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: `1.5px solid ${theme.border}`, fontWeight: '800', color: theme.textHeading }}>
            Import Results ({rows.length} rows, {errorRows.length} with errors)
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '24px 20px', color: theme.textMuted }}>No rows found in this file.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle, borderBottom: `1px solid ${theme.border}`, color: theme.textHeading }}>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Row</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Extracted Title</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '10px 16px', color: theme.textMuted }}>{row.rowNumber}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '700', color: theme.textHeading }}>{row.status}</td>
                    <td style={{ padding: '10px 16px', color: theme.textBody }}>{row.extractedTitle || '—'}</td>
                    <td style={{ padding: '10px 16px', color: theme.alertUrgent }}>{row.errorMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
