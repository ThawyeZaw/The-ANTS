'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Footer
// Four-column responsive layout: Brand, Quick Links, Account, Contact.
// Uses .hp design tokens for full brand consistency. Accessible, semantic,
// keyboard-navigable, and optimized for all viewport sizes.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Mail, MessageCircle, ArrowUpRight } from 'lucide-react';
import DotGrid from '@/components/homepage/DotGrid';

// ── Column data ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Explore', href: '/#explore' },
  { label: 'Features', href: '/#features' },
  { label: 'Clubs', href: '/explore/clubs' },
  { label: 'Profiles', href: '/explore/profiles' },
];

const ACCOUNT_LINKS = [
  { label: 'Sign In', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
  { label: 'About', href: '/about' },
];

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/ThawyeZaw/The-ANTS',
    render: () => (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: '#',
    render: () => <MessageCircle size={15} strokeWidth={1.8} />,
  },
  {
    label: 'Email',
    href: 'mailto:hello@theants.edu',
    render: () => <Mail size={15} strokeWidth={1.8} />,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <DotGrid>
      <footer
        role="contentinfo"
        aria-label="Site footer"
        style={{
          borderTop: '1px solid var(--hp-border)',
          background: 'var(--hp-bg-soft)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--hp-maxw)',
            margin: '0 auto',
            padding: '64px 28px 0',
          }}
        >
          {/* ── Main grid — 4 columns ─────────────────────────────────────── */}
          <div
            className="hp-footer-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr',
              gap: 40,
            }}
          >
            <style>{`
              @media (max-width: 860px) {
                .hp-footer-grid {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
              @media (max-width: 500px) {
                .hp-footer-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            {/* ── Column 1: Brand ─────────────────────────────────────────── */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--hp-font-display)',
                    fontWeight: 600,
                    fontSize: 17,
                    color: 'var(--hp-ink)',
                  }}
                >
                  🐜 <span className="font-brand">The ANTs</span>
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13.5,
                  color: 'var(--hp-ink-muted)',
                  lineHeight: 1.65,
                  margin: '0 0 18px',
                  maxWidth: 280,
                }}
              >
                A student-led ecosystem helping Myanmar students navigate
                international qualifications and achieve academic excellence.
              </p>

              {/* Social icons */}
              <div
                style={{ display: 'flex', gap: 10 }}
                role="list"
                aria-label="Social media links"
              >
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('mailto') ? undefined : '_blank'}
                    rel={social.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                    aria-label={social.label}
                    role="listitem"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'var(--hp-surface)',
                      border: '1px solid var(--hp-border)',
                      color: 'var(--hp-ink-muted)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.color = 'var(--hp-brand)';
                      el.style.borderColor = 'var(--hp-brand)';
                      el.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.color = 'var(--hp-ink-muted)';
                      el.style.borderColor = 'var(--hp-border)';
                      el.style.transform = 'translateY(0)';
                    }}
                  >
                    <social.render />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Column 2: Quick Links ───────────────────────────────────── */}
            <nav aria-label="Quick links">
              <FooterColumnHeading>Quick Links</FooterColumnHeading>
              <FooterLinkList links={QUICK_LINKS} />
            </nav>

            {/* ── Column 3: Account ────────────────────────────────────────── */}
            <nav aria-label="Account links">
              <FooterColumnHeading>Account</FooterColumnHeading>
              <FooterLinkList links={ACCOUNT_LINKS} />
            </nav>

            {/* ── Column 4: Contact ────────────────────────────────────────── */}
            <div>
              <FooterColumnHeading>Contact</FooterColumnHeading>
              <p
                style={{
                  fontFamily: 'var(--hp-font-body)',
                  fontSize: 13,
                  color: 'var(--hp-ink-muted)',
                  lineHeight: 1.6,
                  margin: '0 0 10px',
                }}
              >
                Have questions or want to contribute? We&apos;d love to hear from you.
              </p>
              <a
                href="mailto:hello@theants.edu"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--hp-font-mono)',
                  fontSize: 12.5,
                  color: 'var(--hp-brand)',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                hello@theants.edu
                <ArrowUpRight size={13} strokeWidth={1.8} />
              </a>
            </div>
          </div>

          {/* ── Bottom bar ────────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 44,
              padding: '20px 0',
              borderTop: '1px solid var(--hp-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontFamily: 'var(--hp-font-mono)',
              fontSize: 11.5,
              color: 'var(--hp-ink-faint)',
            }}
          >
            <span suppressHydrationWarning>
              © {new Date().getFullYear()} <span className="font-brand">The ANTs</span>. All rights reserved.
            </span>
            <span>
              <span className="font-brand">The ANTs</span>
            </span>
          </div>
        </div>
      </footer>
    </DotGrid>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FooterColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        fontFamily: 'var(--hp-font-mono)',
        fontSize: 10.5,
        fontWeight: 600,
        color: 'var(--hp-ink)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 14px',
      }}
    >
      {children}
    </h4>
  );
}

function FooterLinkList({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            style={{
              fontFamily: 'var(--hp-font-body)',
              fontSize: 13.5,
              color: 'var(--hp-ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--hp-ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--hp-ink-muted)';
            }}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
