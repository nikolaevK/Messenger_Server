"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const typeDefs_1 = __importDefault(require("./graphql/typeDefs"));
const resolvers_1 = __importDefault(require("./graphql/resolvers"));
const dotenv = __importStar(require("dotenv"));
const client_1 = require("@prisma/client");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
async function main() {
    dotenv.config();
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    const wsServer = new ws_1.WebSocketServer({
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // Pass a different path here if your ApolloServer serves at
        // a different path.
        path: "/graphql/subscriptions",
    });
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: typeDefs_1.default,
        resolvers: resolvers_1.default,
    });
    const prisma = new client_1.PrismaClient();
    const pubsub = new graphql_subscriptions_1.PubSub();
    const serverCleanup = (0, ws_2.useServer)({
        schema,
        context: async (ctx) => {
            if (ctx.connectionParams && ctx.connectionParams.session) {
                return { prisma, pubsub };
            }
            return { prisma, pubsub };
        },
    }, wsServer);
    const server = new server_1.ApolloServer({
        schema,
        csrfPrevention: true,
        plugins: [
            // Proper shutdown for the HTTP server.
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
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
    app.use("/graphql", (0, cors_1.default)(corsOptions), (0, body_parser_1.json)(), (0, express4_1.expressMiddleware)(server, {
        context: async ({ req, res }) => {
            return { prisma, pubsub };
        },
    }));
    await new Promise((resolve) => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
    console.log("🚀 Server ready at http://localhost:4000/graphql");
}
main().catch((err) => console.log(err));
