const session = async ({ session, token }: { session: Session; token: JWT }) => {
  if (token?.id) {
    const userInDb = await prisma.utilisateur.findUnique({
      where: { id: parseInt(token.id as string, 10) },
      select: {
        nom: true,
        email: true,
      },
    });

    if (userInDb) {
      session.user = {
        name: userInDb.nom,
        email: userInDb.email,
        image: null, // ou userInDb.image si ce champ existe dans ta DB
      };
    }
  }

  return session;
};