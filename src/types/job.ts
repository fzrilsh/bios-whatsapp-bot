import type { WASocket } from "baileys";
import { MessageProvider } from "../utils/message-provider.js";

export interface Job {
    name: string;
    every: string;
    execute: (sock: WASocket, msgProvider: MessageProvider) => Promise<void>;
}