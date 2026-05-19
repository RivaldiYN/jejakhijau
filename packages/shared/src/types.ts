// ─── Core domain types ────────────────────────────────────────────────────────

export type MealType = 'warteg' | 'gofood' | 'masak_sendiri' | 'vegetarian'
export type TipCategory = 'transport' | 'food' | 'energy' | 'waste' | 'general'
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  city: string
  role: UserRole
  currentStreak: number
  longestStreak: number
  lastCheckin?: string
  createdAt: string
}

export interface DiaryEntry {
  id: string
  userId: string
  entryDate: string
  ojolKm: number
  angkotKm: number
  krlKm: number
  plastikCount: number
  listrikKwh: number
  mealType: MealType
  bakarSampahKg: number
  totalKgco2e: number
  createdAt: string
}

export interface Badge {
  id: string
  slug: string
  name: string
  description: string
  iconUrl: string
  earnedAt?: string
}

export interface CityRank {
  city: string
  avgKgco2eWeek: number
  userCount: number
  rank: number
}

export interface Tip {
  id: string
  title: string
  body: string
  category: TipCategory
  isPublished: boolean
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

export interface EmissionFactorOverride {
  id: string
  key: string
  value: number
  updatedBy: string
  updatedAt: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  user: Pick<User, 'id' | 'name' | 'city' | 'role'>
}
