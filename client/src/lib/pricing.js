export const membershipPackages = [
  {
    key: 'strength-training',
    label: 'Strength Training',
    name: 'Strength Training',
    icon: '🏋️',
    description: 'Dumbbell circuit training for muscle, strength, and mobility.',
    prices: {
      university: 400,
      external: 600,
    },
    perks: ['Guided dumbbell workouts', 'Strength-building circuits', 'Technique coaching included'],
    cta: 'Book Strength',
  },
  {
    key: 'cardio-training',
    label: 'Cardio Training',
    name: 'Cardio Training',
    icon: '🚴',
    description: 'Machine-based cardio sessions designed for endurance and power.',
    prices: {
      university: 500,
      external: 700,
    },
    perks: ['Treadmill + bike routines', 'Heart-rate guided training', 'Recovery tips'],
    cta: 'Book Cardio',
  },
  {
    key: 'aerobics-training',
    label: 'Aerobics Training',
    name: 'Aerobics Training',
    icon: '🎵',
    description: 'High-energy aerobics classes for fun, fitness, and flexibility.',
    prices: {
      university: 500,
      external: 700,
    },
    perks: ['Music-driven workouts', 'Group motivation', 'Low-impact options'],
    cta: 'Book Aerobics',
  },
  {
    key: 'vip-training',
    label: 'VIP Training',
    name: 'VIP Training',
    icon: '✨',
    description: 'Premium one-on-one coaching with priority support and perks.',
    prices: {
      university: 1000,
      external: 2000,
    },
    perks: ['Personalized training plan', 'Priority scheduling', 'Exclusive access'],
    cta: 'Book VIP',
    featured: true,
  },
]

export const membershipPackageOptions = membershipPackages.map((plan) => ({
  value: plan.key,
  label: plan.label,
}))

export const membershipPackageMap = Object.fromEntries(
  membershipPackages.map((plan) => [plan.key, plan])
)

export const getMembershipPackagePrice = (packageKey, memberType = 'university') => {
  const plan = membershipPackageMap[packageKey]
  if (!plan) return 0
  return plan.prices[memberType === 'external' ? 'external' : 'university']
}

export const getMembershipPackageLabel = (packageKey) => {
  return membershipPackageMap[packageKey]?.label || packageKey
}

export const normalizeMembershipPackageKey = (value) => {
  const normalized = value.toString().trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '')

  return {
    strengthtraining: 'strength-training',
    strengthtrainingdubbell: 'strength-training',
    strength: 'strength-training',
    'strength-training': 'strength-training',
    cardioresistance: 'cardio-training',
    cardiotraining: 'cardio-training',
    cardio: 'cardio-training',
    'cardio-training': 'cardio-training',
    aerobicstraining: 'aerobics-training',
    aerobics: 'aerobics-training',
    'aerobics-training': 'aerobics-training',
    viptraining: 'vip-training',
    vip: 'vip-training',
    'vip-training': 'vip-training',
    monthly: 'monthly',
    '3month': '3months',
    '3months': '3months',
    '6month': '6months',
    '6months': '6months',
    '1year': '1year',
    yearly: '1year',
    annual: '1year',
  }[normalized] || ''
}

export const packagePricing = {
  'strength-training': { university: 400, external: 600 },
  'cardio-training': { university: 500, external: 700 },
  'aerobics-training': { university: 500, external: 700 },
  'vip-training': { university: 1000, external: 2000 },
  monthly: { university: 240, external: 300 },
  '3months': { university: 640, external: 800 },
  '6months': { university: 1200, external: 1500 },
  '1year': { university: 2000, external: 2500 },
}
