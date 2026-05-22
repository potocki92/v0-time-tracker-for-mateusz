import type { CSSProperties } from 'react'

export interface PricingPlan {
  name: string
  badge: { label: string; className: string }
  price: string
  period: string
  desc: string
  cta: { label: string; href: string; className: string; icon?: boolean }
  features: string[]
  hot: boolean
  popular?: boolean
  nameStyle?: CSSProperties
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Solo',
    badge: { label: 'Free', className: 'chip-mute' },
    price: '€0',
    period: '/ month',
    desc: 'For one independent. Track, invoice, get paid.',
    cta: { label: 'Start free', href: '#cta', className: 'cta-ghost' },
    features: ['Unlimited time entries', '3 active projects', '5 invoices / month', 'CSV export'],
    hot: false,
  },
  {
    name: 'Pro',
    badge: { label: '14‑day trial', className: 'chip-emerald' },
    price: '€12',
    period: '/ month',
    desc: 'For the working independent. The full clock + invoice machine.',
    cta: { label: 'Start Pro trial', href: '#cta', className: 'cta-primary', icon: true },
    features: [
      'Everything in Solo',
      'Unlimited projects & invoices',
      'Stripe + SEPA payments',
      'Auto‑invoice from timesheet',
      'Calendar & Slack sync',
      'Custom invoice templates',
    ],
    hot: true,
    popular: true,
    nameStyle: { color: '#7BEAA9' },
  },
  {
    name: 'Studio',
    badge: { label: 'Teams', className: 'chip-mute' },
    price: '€8',
    period: '/ seat / month',
    desc: 'For small teams and agencies. Roles, approvals, consolidated billing.',
    cta: { label: 'Talk to us', href: '#cta', className: 'cta-ghost', icon: true },
    features: [
      'Everything in Pro',
      'Team timesheets & approvals',
      'Roles & permissions',
      'SSO & SCIM',
      'Priority support',
    ],
    hot: false,
  },
]
