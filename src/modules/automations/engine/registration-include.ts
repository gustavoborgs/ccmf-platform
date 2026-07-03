export const automationRegistrationInclude = {
  contest: { select: { year: true } },
  category: { select: { name: true } },
  participant: {
    include: {
      guardian: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  },
  photos: { select: { createdAt: true }, orderBy: { createdAt: "asc" as const } },
  payments: {
    where: { status: "PENDING" },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
  _count: { select: { photos: true } },
} as const;
