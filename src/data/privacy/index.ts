/**
 * Privacy Notice — Data Index
 *
 * Unified access to testnet and mainnet privacy notices.
 * Testnet and mainnet terms/disclosures remain distinct.
 */

import type { PrivacyVersion, PrivacyMetadata, NetworkType } from '@/app/types/privacy';
import {
  TESTNET_PRIVACY_VERSIONS,
  TESTNET_PRIVACY_METADATA,
  getTestnetPrivacy,
  getTestnetPrivacyMetadata,
} from './testnet';
import {
  MAINNET_PRIVACY_VERSIONS,
  MAINNET_PRIVACY_METADATA,
  getMainnetPrivacy,
  getMainnetPrivacyMetadata,
} from './mainnet';

export function getPrivacyVersions(network: NetworkType): PrivacyVersion[] {
  return network === 'testnet' ? TESTNET_PRIVACY_VERSIONS : MAINNET_PRIVACY_VERSIONS;
}

export function getPrivacyMetadata(network: NetworkType): PrivacyMetadata {
  return network === 'testnet' ? TESTNET_PRIVACY_METADATA : MAINNET_PRIVACY_METADATA;
}

export function getPrivacy(network: NetworkType, version?: string): PrivacyVersion {
  return network === 'testnet' ? getTestnetPrivacy(version) : getMainnetPrivacy(version);
}

export function getCurrentPrivacy(network: NetworkType): PrivacyVersion {
  const metadata = getPrivacyMetadata(network);
  return getPrivacy(network, metadata.currentVersion);
}

export {
  TESTNET_PRIVACY_VERSIONS,
  TESTNET_PRIVACY_METADATA,
  getTestnetPrivacy,
  getTestnetPrivacyMetadata,
};

export {
  MAINNET_PRIVACY_VERSIONS,
  MAINNET_PRIVACY_METADATA,
  getMainnetPrivacy,
  getMainnetPrivacyMetadata,
};
