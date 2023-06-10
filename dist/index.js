import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import { json } from "body-parser";
import express from "express";
import http from "http";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
async function main() {
    dotenv.config();
    const app = express();
    const httpServer = http.createServer(app);
    const wsServer = new WebSocketServer({
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // Pass a different path here if your ApolloServer serves at
        // a different path.
        path: "/graphql/subscriptions",
    });
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });
    const prisma = new PrismaClient();
    const pubsub = new PubSub();
    const serverCleanup = useServer({
        schema,
        context: async (ctx) => {
            if (ctx.connectionParams && ctx.connectionParams.session) {
                return { prisma, pubsub };
            }
            return { prisma, pubsub };
        },
    }, wsServer);
    const server = new ApolloServer({
        schema,
        csrfPrevention: true,
        plugins: [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({ httpServer }),
            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });
    await server.start();
    const corsOptions = {
        origin: process.env.CLIENT_ORIGIN,
        credentials: true,
    };
    app.use("/graphql", cors(corsOptions), json(), expressMiddleware(server, {
        context: async ({ req, res }) => {
            return { prisma, pubsub };
        },
    }));
    await new Promise((resolve) => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
    console.log("🚀 Server ready at http://localhost:4000/graphql");
}
main().catch((err) => console.log(err));
