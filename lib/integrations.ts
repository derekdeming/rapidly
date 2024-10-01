import prismadb from "@/lib/prismadb"

export const fetchIntegrations = async (userId: string) => {
  const integrations = await prismadb.account.findMany({
    where: {
      userId: userId
    },
    select: {
      provider: true,
      metadata: true
    }
  })
  return integrations
}