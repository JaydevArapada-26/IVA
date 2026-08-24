import React, { useState } from 'react';
import { ThemeColors } from 'shared/constants/theme';

interface AdminSettingsProps {
  theme: ThemeColors;
}

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const AdminSettings: React.FC<AdminSettingsProps> = ({ theme }) => {
  const [autoApproveCsv, setAutoApproveCsv] = useState(false);
  const [voiceSynthesisActive, setVoiceSynthesisActive] = useState(true);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: theme.textHeading, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon /> System Configuration & Feature Flags
        </h2>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
          Manage global AI voice models, ingestion queue rules, and notification gateway throttling
        </p>
      </div>

      <div style={{ backgroundColor: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: theme.textHeading }}>Auto-Approve Ingestion Scraped CSVs</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Bypass admin manual review for trusted government domains</div>
          </div>
          <input
            type="checkbox"
            checked={autoApproveCsv}
            onChange={(e) => setAutoApproveCsv(e.target.checked)}
            style={{ width: '22px', height: '22px', accentColor: theme.primary, cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: theme.textHeading }}>Multilingual AI Voice Engine</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Enable natural language text-to-speech synthesis across 7 languages</div>
          </div>
          <input
            type="checkbox"
            checked={voiceSynthesisActive}
            onChange={(e) => setVoiceSynthesisActive(e.target.checked)}
            style={{ width: '22px', height: '22px', accentColor: theme.primary, cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
