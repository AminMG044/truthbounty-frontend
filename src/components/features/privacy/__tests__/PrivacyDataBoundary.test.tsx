import {
  PRIVACY_SECTIONS,
  PRIVACY_SECTION_BOUNDARIES,
} from '@/app/types/privacy';
import { TESTNET_PRIVACY_VERSIONS } from '@/data/privacy/testnet';
import { MAINNET_PRIVACY_VERSIONS } from '@/data/privacy/mainnet';

describe('Privacy Data Boundary Architecture', () => {
  it('covers all 9 mandatory sections in boundary mapping', () => {
    expect(PRIVACY_SECTIONS).toHaveLength(9);
    PRIVACY_SECTIONS.forEach((sectionId) => {
      expect(PRIVACY_SECTION_BOUNDARIES[sectionId]).toBeDefined();
    });
  });

  it('classifies public ledger data and public evidence as immutable-chain', () => {
    expect(PRIVACY_SECTION_BOUNDARIES['wallet-blockchain']).toBe('immutable-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['evidence-public-source']).toBe('immutable-chain');
  });

  it('classifies off-chain systems, sessions, and logs as controllable-off-chain', () => {
    expect(PRIVACY_SECTION_BOUNDARIES['session-support']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['logs']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['processor']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['retention']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['request']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['jurisdiction']).toBe('controllable-off-chain');
    expect(PRIVACY_SECTION_BOUNDARIES['revision']).toBe('controllable-off-chain');
  });

  it('ensures all testnet clauses conform to the required data boundary classifications', () => {
    TESTNET_PRIVACY_VERSIONS.forEach((version) => {
      version.clauses.forEach((clause) => {
        const expectedBoundary =
          PRIVACY_SECTION_BOUNDARIES[clause.id as keyof typeof PRIVACY_SECTION_BOUNDARIES];
        expect(clause.dataBoundary).toBe(expectedBoundary);
      });
    });
  });

  it('ensures all mainnet clauses conform to the required data boundary classifications', () => {
    MAINNET_PRIVACY_VERSIONS.forEach((version) => {
      version.clauses.forEach((clause) => {
        const expectedBoundary =
          PRIVACY_SECTION_BOUNDARIES[clause.id as keyof typeof PRIVACY_SECTION_BOUNDARIES];
        expect(clause.dataBoundary).toBe(expectedBoundary);
      });
    });
  });

  it('ensures only published versions can have status published (fail-closed)', () => {
    [...TESTNET_PRIVACY_VERSIONS, ...MAINNET_PRIVACY_VERSIONS].forEach((version) => {
      if (version.status === 'published') {
        expect(version.publishedAt).toBeDefined();
        expect(version.source).toMatch(/^(board|governance|legal)$/);
      } else {
        expect(version.status).toBe('draft');
      }
    });
  });
});
