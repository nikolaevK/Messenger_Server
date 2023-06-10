"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
const conversation_1 = __importDefault(require("./conversation"));
const message_1 = __importDefault(require("./message"));
const typeDefs = [user_1.default, conversation_1.default, message_1.default];
exports.default = typeDefs;
