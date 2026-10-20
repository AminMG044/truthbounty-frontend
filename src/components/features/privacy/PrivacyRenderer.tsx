'use client';

import React, { useState, useMemo } from 'react';
import { sanitizeText } from '@/lib/security/evidence-sanitizer';
import { PrivacySection } from './PrivacySection';
import { PrivacyVersionSelector } from './PrivacyVersionSelector';
import { PrivacyReviewState, PrivacyReviewSummary } from './PrivacyReviewState';
import { PrivacyDataBoundaryLegend } from './PrivacyDataBoundaryLegend';
import type {
  PrivacyVersion,
  PrivacyClause,
  PrivacySectionId,
  NetworkType,
  ClauseStatus,
} from '@/app/types/privacy';
import {
  PRIVACY_SECTIONS,
  PRIVACY_SECTION_TITLES,
  PRIVACY_SECTION_BOUNDARIES,
} from '@/app/types/privacy';

interface PrivacyRendererProps {
  version: PrivacyVersion;
  allVersions: PrivacyVersion[];
  network: NetworkType;
  onVersionChange: (version: string) => void;
}

export function PrivacyRenderer({
  version,
  allVersions,
  network,
  onVersionChange,
}: PrivacyRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(PRIVACY_SECTIONS),
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const clauseMap = useMemo(() => {
    const map = new Map<string, PrivacyClause>();
    version.clauses.forEach((clause) => map.set(clause.id, clause));
    return map;
  }, [version.clauses]);

  const sortedClauses = useMemo(() => {
    return PRIVACY_SECTIONS.map((sectionId) => {
      const clause = clauseMap.get(sectionId);
      if (clause) return clause;
      // Synthetic unavailable clause for missing sections (fail-closed)
      return {
        id: sectionId,
        title: PRIVACY_SECTION_TITLES[sectionId],
        content:
          'This privacy section is currently unavailable. It may be pending legal review, regulatory approval, or governance voting.',
        status: 'unavailable' as ClauseStatus,
        dataBoundary: PRIVACY_SECTION_BOUNDARIES[sectionId],
        reviewerNotes: undefined,
      };
    });
  }, [clauseMap]);

  const safeVersionTitle = sanitizeText(version.version, 50);
  const safeEffectiveDate = sanitizeText(version.effectiveDate, 50);
  const safeMaterialChanges = sanitizeText(version.materialChanges, 5000);
  const safeSource = sanitizeText(version.source, 50);
  const safeOperator = sanitizeText(version.operator, 150);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const effectiveDateFormatted = formatDate(safeEffectiveDate);
  const publishedAtFormatted = version.publishedAt ? formatDate(version.publishedAt) : null;

  return (
    <div className="tb-content space-y-8">
      {/* Header */}
      <header className="space-y-4 pb-6 border-b border-divider" role="banner">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="tb-display font-bold text-ink">Privacy Notice</h1>
            <p className="tb-body text-ink-muted mt-1">
              Version {safeVersionTitle} • Effective {effectiveDateFormatted}
            </p>
            <p className="tb-small text-ink-muted mt-0.5">
              Operator: <span className="text-ink font-medium">{safeOperator}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                version.status === 'published'
                  ? 'bg-green-900/30 text-green-400 border-green-700'
                  : 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
              }`}
              aria-label={
                version.status === 'published'
                  ? 'This privacy notice version is published'
                  : 'Draft version — not published as approved'
              }
            >
              {version.status === 'published' ? 'Published' : 'Draft'}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                network === 'testnet'
                  ? 'bg-blue-900/30 text-blue-400 border-blue-700'
                  : 'bg-purple-900/30 text-purple-400 border-purple-700'
              }`}
              aria-label={network === 'testnet' ? 'Testnet notice' : 'Mainnet notice'}
            >
              {network === 'testnet' ? 'Testnet' : 'Mainnet'}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                safeSource === 'governance'
                  ? 'bg-purple-900/30 text-purple-400 border-purple-700'
                  : safeSource === 'board'
                  ? 'bg-blue-900/30 text-blue-400 border-blue-700'
                  : 'bg-green-900/30 text-green-400 border-green-700'
              }`}
              aria-label={`Source: ${safeSource}`}
            >
              {safeSource === 'governance' ? 'Governance' : safeSource === 'board' ? 'Board' : 'Legal'}
            </span>
          </div>
        </div>

        {/* Material Changes Accordion */}
        <details className="group">
          <summary className="tb-label text-ink-muted cursor-pointer flex items-center gap-2 list-none group-hover:text-ink transition-colors">
            <svg
              className="w-5 h-5 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Material Changes in This Version</span>
          </summary>
          <div className="mt-3 p-4 bg-elevated rounded-lg border border-divider">
            <p className="tb-body text-ink-secondary whitespace-pre-wrap">{safeMaterialChanges}</p>
          </div>
        </details>

        {/* Version Metadata Dates */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Effective: {effectiveDateFormatted}</span>
          </div>
          {publishedAtFormatted && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Published: {publishedAtFormatted}</span>
            </div>
          )}
          {version.previousVersion && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous: v{version.previousVersion}</span>
            </div>
          )}
        </div>
      </header>

      {/* Data Boundary Classification Legend */}
      <PrivacyDataBoundaryLegend />

      {/* Review Summary (only rendered if there are review/unavailable clauses) */}
      <PrivacyReviewSummary
        clauses={sortedClauses.map((c) => ({ id: c.id, title: c.title, status: c.status }))}
        network={network}
      />

      {/* Privacy Clauses Accordion List */}
      <div className="space-y-0" aria-label="Privacy notice clauses">
        {sortedClauses.map((clause) => {
          const isExpanded = expandedSections.has(clause.id);
          const sectionId = clause.id as PrivacySectionId;

          return (
            <article key={clause.id} className="pb-8 border-b border-divider last:border-0">
              {/* Review State Banner */}
              {clause.status !== 'approved' && (
                <div className="mb-4">
                  <PrivacyReviewState
                    status={clause.status}
                    reviewerNotes={clause.reviewerNotes}
                    clauseTitle={clause.title}
                    network={network}
                  />
                </div>
              )}

              {/* Section Header with Accordion Toggle */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection(clause.id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-surface/50 border border-divider hover:bg-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
                  aria-expanded={isExpanded}
                  aria-controls={`${clause.id}-content`}
                >
                  <div className="flex-1 text-left">
                    <h2
                      id={`${clause.id}-heading`}
                      className="tb-section text-ink font-semibold flex flex-wrap items-center gap-2"
                    >
                      {PRIVACY_SECTION_TITLES[sectionId] || clause.title}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          clause.dataBoundary === 'immutable-chain'
                            ? 'bg-cyan-950/40 text-cyan-300 border-cyan-600/70'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/70'
                        }`}
                        aria-label={`Boundary: ${
                          clause.dataBoundary === 'immutable-chain'
                            ? 'Immutable On-Chain'
                            : 'Controllable Off-Chain'
                        }`}
                      >
                        {clause.dataBoundary === 'immutable-chain'
                          ? 'Immutable On-Chain'
                          : 'Controllable Off-Chain'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          clause.status === 'approved'
                            ? 'bg-green-900/30 text-green-400 border-green-700'
                            : clause.status === 'review'
                            ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
                            : 'bg-red-900/30 text-red-400 border-red-700'
                        }`}
                        aria-label={`Status: ${clause.status}`}
                      >
                        {clause.status === 'approved'
                          ? 'Approved'
                          : clause.status === 'review'
                          ? 'Review'
                          : 'Unavailable'}
                      </span>
                    </h2>
                    <p className="tb-small text-ink-muted mt-1">
                      {PRIVACY_SECTIONS.includes(sectionId) ? PRIVACY_SECTION_TITLES[sectionId] : ''}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-ink-muted transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Section Content */}
              <div
                id={`${clause.id}-content`}
                role="region"
                aria-labelledby={`${clause.id}-heading`}
                hidden={!isExpanded}
                className="animate-in fade-in-0 duration-200"
              >
                <PrivacySection clause={clause} sectionId={sectionId} network={network} />
              </div>
            </article>
          );
        })}
      </div>

      {/* Expand/Collapse All Controls */}
      <div className="flex justify-center gap-4 pt-6 border-t border-divider">
        <button
          onClick={() => setExpandedSections(new Set(PRIVACY_SECTIONS))}
          className="tb-touch px-6 py-2 text-sm font-medium text-ink bg-surface border border-divider rounded-lg hover:bg-elevated transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedSections(new Set())}
          className="tb-touch px-6 py-2 text-sm font-medium text-ink bg-surface border border-divider rounded-lg hover:bg-elevated transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
        >
          Collapse All
        </button>
      </div>

      {/* Version History Section */}
      <section
        aria-labelledby="version-history-heading"
        className="pt-8 border-t border-divider"
        aria-label="Version history for Privacy Notice"
      >
        <h2 id="version-history-heading" className="tb-title font-bold text-ink mb-6">
          Version History
        </h2>
        <PrivacyVersionSelector
          versions={allVersions}
          currentVersion={version.version}
          network={network}
          onVersionChange={onVersionChange}
          operator={safeOperator}
        />
      </section>

      {/* Footer Disclaimer */}
      <footer className="pt-8 border-t border-divider text-center" role="contentinfo">
        <p className="tb-small text-ink-muted max-w-2xl mx-auto">
          {network === 'mainnet' ? (
            <>
              This Mainnet Privacy Notice is issued by {safeOperator} for interactions on Optimism Mainnet.
              Only approved versioned content is published and legally binding. On-chain transaction records
              are mathematically permanent and cannot be modified or erased.
              <br />
              For privacy requests or technical inquiries, contact the protocol team via established governance channels.
            </>
          ) : (
            <>
              This Testnet Privacy Notice is issued by {safeOperator} for developer testing on Optimism Sepolia.
              Testnet tokens have no monetary value. Only approved versioned clauses are effective.
              <br />
              For feedback or inquiries, contact the protocol team via official development channels.
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
