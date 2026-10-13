import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EvidenceViewer } from '../EvidenceViewer';

describe('EvidenceViewer canonical evidence states', () => {
  it('shows an explicit empty state for an empty supplied list', () => {
    render(<EvidenceViewer claimId="claim-123" evidence={[]} />);
    expect(screen.getByText('No evidence available.')).toBeInTheDocument();
  });

  it('renders a validated HTTPS image with privacy-preserving attributes', () => {
    render(
      <EvidenceViewer
        claimId="claim-123"
        evidence={[{ type: 'image', value: 'https://example.com/evidence.png' }]}
      />,
    );

    const image = screen.getByRole('img', { name: 'Evidence 1' });
    expect(image).toHaveAttribute('src', 'https://example.com/evidence.png');
    expect(image).toHaveAttribute('referrerPolicy', 'no-referrer');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('blocks unsafe links and images instead of mounting active content', () => {
    render(
      <EvidenceViewer
        claimId="claim-123"
        evidence={[
          { type: 'link', value: 'javascript:alert(1)' },
          { type: 'image', value: 'data:image/png;base64,invalid' },
        ]}
      />,
    );

    expect(screen.getAllByTestId('evidence-blocked-item')).toHaveLength(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders HTTPS links as hardened new-tab anchors', () => {
    render(
      <EvidenceViewer
        claimId="claim-123"
        evidence={[
          { type: 'link', value: 'https://trusted-source.com/evidence.pdf' },
          { type: 'link', value: 'http://insecure-source.com' },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /trusted-source/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(screen.getAllByTestId('evidence-blocked-item')).toHaveLength(1);
  });

  it('renders untrusted text only as escaped text content', () => {
    render(
      <EvidenceViewer
        claimId="claim-123"
        evidence={[{ type: 'text', value: '<script>alert("xss")</script>' }]}
      />,
    );

    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('treats supported video references as links, not embedded media', () => {
    render(
      <EvidenceViewer
        claimId="claim-123"
        evidence={[{ type: 'video', value: 'https://example.com/video.mp4' }]}
      />,
    );

    expect(screen.getByRole('link', { name: /video\.mp4/i })).toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();
  });

  it('keeps the disclosure control keyboard-operable and labelled', () => {
    render(<EvidenceViewer claimId="claim-123" evidence={[]} />);
    const toggle = screen.getByRole('button', { name: /evidence/i });
    expect(toggle).toHaveAttribute('aria-controls', 'evidence-content');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('evidence-scroll-container')).not.toBeInTheDocument();
  });
});
