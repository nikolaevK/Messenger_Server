const resolvers = {
    Query: {
        searchUsers: async (_, args, context) => {
            const { username: SearchedUserName, session } = args;
            const { prisma } = context;
            if (!session?.user)
                throw new Error("Not authorized");
            const { user: { username: currentUserName }, } = session;
            try {
                const users = await prisma.user.findMany({
                    where: {
                        username: {
                            contains: SearchedUserName,
                            not: currentUserName,
                            mode: "insensitive",
                        },
                    },
                });
                return users;
            }
            catch (error) {
                console.log("searchUser error", error);
                throw new Error(error?.message);
            }
        },
    },
    Mutation: {
        createUsername: async (_, args, context) => {
            const { username, session } = args;
            const { prisma } = context;
            if (!session?.user) {
                return {
                    error: "Not authorized",
                };
            }
            const { id: userId } = session.user;
            try {
                const existingUser = await prisma.user.findUnique({
                    where: {
                        username,
                    },
                });
                if (existingUser) {
                    return {
                        error: "User already exists",
                    };
                }
                await prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        username,
                    },
                });
                return { success: true };
            }
            catch (error) {
                console.log("createUsername error", error);
                return {
                    error: error?.message,
                };
            }
        },
    },
};
export default resolvers;
