// import {
//   GmailCreateDraft,
//   GmailGetMessage,
//   GmailGetThread,
//   GmailSearch,
//   GmailSendMessage
// } from "@langchain/community/tools/gmail";
import { StructuredTool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { ChatOpenAI, OpenAI } from "@langchain/openai";
import {
  AgentExecutor,
  createReactAgent,
  createToolCallingAgent,
  initializeAgentExecutorWithOptions,
  StructuredChatOutputParser
} from "langchain/agents";
import { GmailCreateDraft } from "../gmail/create_draft";
import { GmailGetMessage } from "../gmail/get_message";
import { GmailGetThread } from "../gmail/get_thread";
import { GmailSearch } from "../gmail/search";
import { GmailSendMessage } from "../gmail/send_message";
import { getGmailAuth } from "../util";
import { gmail_v1 } from "googleapis";
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { zodFunction } from "openai/helpers/zod";
import { ToolDefinition } from "@langchain/core/language_models/base";
import {
  convertToOpenAIFunction,
  isLangChainTool
} from "@langchain/core/utils/function_calling";
import { zodToJsonSchema } from "zod-to-json-schema";
import { makeParseableTool } from "openai/lib/parser";

export async function run(query: string) {
  // These are the default parameters for the Gmail tools
  const gmailParams = {
    credentials: {
      clientEmail: process.env.GMAIL_CLIENT_EMAIL,
      privateKey: process.env.GMAIL_PRIVATE_KEY
    },
    scopes: ["https://mail.google.com/"]
  };

  const auth: gmail_v1.Gmail | undefined = await getGmailAuth();

  if (!auth) return;

  // For custom parameters, uncomment the code above, replace the values with your own, and pass it to the tools below
  const tools = [
    new GmailCreateDraft(auth, gmailParams),
    new GmailGetMessage(auth, gmailParams),
    new GmailGetThread(auth, gmailParams),
    new GmailSearch(auth, gmailParams),
    new GmailSendMessage(auth, gmailParams)
  ];

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant"],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const agent = createToolCallingAgent({ llm, tools, prompt });

  const agentExecutor = new AgentExecutor({
    agent,
    tools
  });

  // const input = "Draft an email thanking them for coffee.";
  // const input = "what is LangChain?";
  // const input = "Draft an email to fake@fake.com thanking them for coffee.";
  const input = query || "Hello";
  const result = await agentExecutor.invoke({
    input
  });

  console.log("View Result", result);
  return result;
}
