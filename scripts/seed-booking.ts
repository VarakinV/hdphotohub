import { prisma } from "@/lib/db/prisma";

type AdminUser = { id: string; email: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getTargetAdmin(): Promise<AdminUser> {
  const targetEmail = process.env.ADMIN_EMAIL;
  if (targetEmail) {
    const user = await prisma.user.findFirst({ where: { email: targetEmail, OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] } });
    if (!user) throw new Error(`ADMIN_EMAIL ${targetEmail} not found or not an admin.`);
    return { id: user.id, email: user.email! };
  }
  const anyAdmin = await prisma.user.findFirst({ where: { OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] } });
  if (!anyAdmin) throw new Error("No ADMIN or SUPERADMIN user found.");
  return { id: anyAdmin.id, email: anyAdmin.email! };
}

async function seedCategories(adminId: string) {
  const names = ["Essential", "Skyline", "Social Boost"];
  for (const name of names) {
    const slug = slugify(name);
    await prisma.serviceCategory.upsert({
      where: { adminId_slug: { adminId, slug } },
      update: { name, active: true },
      create: { adminId, name, slug, active: true },
    });
  }
}

async function seedTaxes(adminId: string) {
  const taxes = [
    { name: "GST", rateBps: 500 },
    { name: "PST", rateBps: 700 },
  ];
  for (const t of taxes) {
    await prisma.tax.upsert({
      where: { adminId_name: { adminId, name: t.name } },
      update: { rateBps: t.rateBps, active: true },
      create: { adminId, name: t.name, rateBps: t.rateBps, active: true },
    });
  }
}

async function main() {
  const admin = await getTargetAdmin();
  console.log(`Seeding booking data for admin: ${admin.email}`);
  await seedCategories(admin.id);
  await seedTaxes(admin.id);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

