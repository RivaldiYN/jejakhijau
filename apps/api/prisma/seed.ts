import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Badges ──────────────────────────────────────────────────────────────────
  const badges = [
    {
      slug: 'first_checkin',
      name: 'Langkah Pertama',
      description: 'Selamat! Kamu berhasil melakukan check-in pertamamu.',
      iconUrl: '/badges/first-checkin.svg',
    },
    {
      slug: 'streak_7',
      name: 'Konsisten 7 Hari',
      description: '7 hari berturut-turut check-in — kamu serius!',
      iconUrl: '/badges/streak-7.svg',
    },
    {
      slug: 'streak_30',
      name: 'Bulan Hijau',
      description: '30 hari berturut-turut. Kebiasaan hijau terbentuk!',
      iconUrl: '/badges/streak-30.svg',
    },
    {
      slug: 'streak_100',
      name: 'Pahlawan Iklim',
      description: '100 hari! Kamu adalah inspirasi bagi banyak orang.',
      iconUrl: '/badges/streak-100.svg',
    },
    {
      slug: 'low_carbon_day',
      name: 'Hari Bersih',
      description: 'Emisi hari ini di bawah 2 kgCO₂e. Luar biasa!',
      iconUrl: '/badges/low-carbon.svg',
    },
    {
      slug: 'vegetarian_day',
      name: 'Pejuang Nabati',
      description: 'Memilih makanan vegetarian untuk bumi yang lebih sehat.',
      iconUrl: '/badges/vegetarian.svg',
    },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    })
  }
  console.log(`✅ ${badges.length} badges seeded`)

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@jejakhijau.id'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123!changeme'
  const hash = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin' },
    create: {
      email: adminEmail,
      passwordHash: hash,
      name: 'Admin JejakHijau',
      city: 'Jakarta',
      role: 'admin',
    },
  })
  console.log(`✅ Admin user seeded: ${adminEmail}`)

  // ── Sample tips ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } })
  const tips = [
    {
      title: 'Pilih KRL daripada ojol untuk jarak > 5 km',
      body: 'KRL menghasilkan ~5× lebih sedikit emisi per km dibanding ojek online. Untuk jarak 10 km, perbedaannya sekitar 0.7 kgCO₂e per perjalanan.',
      category: 'transport',
      isPublished: true,
      createdBy: admin!.id,
    },
    {
      title: 'Masak sendiri hemat 30% emisi makanan',
      body: 'Memasak sendiri mengurangi emisi dari packaging, pengiriman, dan food waste. Coba meal prep mingguan untuk efisiensi maksimal.',
      category: 'food',
      isPublished: true,
      createdBy: admin!.id,
    },
    {
      title: 'Matikan AC 30 menit sebelum keluar ruangan',
      body: 'AC adalah penyumbang terbesar emisi listrik rumah tangga. Membiasakan mematikan 30 menit lebih awal bisa hemat ~0.2 kWh per hari.',
      category: 'energy',
      isPublished: true,
      createdBy: admin!.id,
    },
  ]

  for (const tip of tips) {
    await prisma.tip.create({ data: tip }).catch(() => {})
  }
  console.log(`✅ ${tips.length} tips seeded`)

  console.log('🌿 Seeding selesai!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
