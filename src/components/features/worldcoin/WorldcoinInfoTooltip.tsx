'use client';

import { useState } from 'react';
import { IdentityGlyph } from './IdentityGlyph';

export function WorldcoinInfoTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        aria-label="Learn about Worldcoin verification"
      >
        <IdentityGlyph name="help" />
        <span>Why verify?</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Worldcoin Verification Benefits
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prove you&apos;re a unique human to unlock full platform access and protect against manipulation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <IdentityGlyph name="shield" className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Sybil Resistance
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Prevents fake accounts and manipulation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <IdentityGlyph name="users" className="text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Higher Trust Score
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Increases your reputation and credibility
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <IdentityGlyph name="zap" className="text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Increased Limits
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Higher stake amounts and priority access
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <IdentityGlyph name="lock" className="text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Privacy Preserved
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Zero-knowledge proofs protect your identity
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <a
                href="https://worldcoin.org/how-it-works"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn more about Worldcoin →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
