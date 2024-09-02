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

export async function run() {
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
    new GmailCreateDraft(auth, gmailParams)
    // new GmailGetMessage(gmailParams),
    // new GmailGetThread(gmailParams),
    // new GmailSearch(gmailParams),
    // new GmailSendMessage(gmailParams)
  ];

  // https://smith.langchain.com/hub/hwchase17/react
  // const prompt = await pull<PromptTemplate>("hwchase17/react");

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0
  });

  // const agent = await createReactAgent({
  //   llm,
  //   tools,
  //   prompt
  // });

  console.log(tools[0].name);
  console.log(tools[0].description);
  console.log(tools[0].schema);

  const parser = StructuredOutputParser.fromZodSchema(tools[0].schema);
  const value = zodToJsonSchema(tools[0].schema, { name: tools[0].name });
  console.log("zodFunction", JSON.stringify(value));

  // console.log("zodToJsonSchema(tool.schema)", zodToJsonSchema(tools[0].schema));
  // console.log("tools[0].schema", parser.getFormatInstructions());

  const make = makeParseableTool<any>(
    {
      type: "function",
      function: {
        name: tools[0].name,
        parameters: value,
        strict: true,
        ...(tools[0].description
          ? { description: tools[0].description }
          : undefined)
      }
    },
    {
      callback: undefined,
      parser: (args) => tools[0].schema.parse(JSON.parse(args))
    }
  );

  console.log("makeParseableTool", JSON.stringify(make));

  const tool = tools[0];

  const oaiToolDef = zodFunction({
    name: tool.name,
    parameters: tool.schema,
    description: tool.description
  });

  console.log("oaiToolDef", JSON.stringify(oaiToolDef));

  // let toolDef: ToolDefinition | undefined;

  // if (!oaiToolDef.function.parameters) {
  //   console.log("oaiToolDef", true);
  //   // Fallback to the `convertToOpenAIFunction` util if the parameters are not defined.
  //   // toolDef = {
  //   //   type: "function",
  //   //   function: convertToOpenAIFunction(tool, fields)
  //   // };
  // } else {
  //   console.log("oaiToolDef", false);
  // }

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant"],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const agent = createToolCallingAgent({ llm, tools, prompt });

  // const agentExecutor = new AgentExecutor({
  //   agent,
  //   tools
  // });

  // const input = "Draft an email thanking them for coffee.";
  // // const input = "what is LangChain?";
  // // const input = "Draft an email to fake@fake.com thanking them for coffee.";
  // const result = await agentExecutor.invoke({
  //   input
  // });

  // console.log("View Result", result);

  // const model = new OpenAI({
  //   temperature: 0,
  //   apiKey: process.env.OPENAI_API_KEY,
  //   model: "gpt-4o-mini"
  // });

  // const gmailAgent = await initializeAgentExecutorWithOptions(tools, model, {
  //   agentType: "structured-chat-zero-shot-react-description",
  //   verbose: true
  // });

  // const example_query =
  //   "Draft an email to fake@fake.com thanking them for coffee.";

  // const createResult = await gmailAgent.invoke({ input: example_query });
  // //   Create Result {
  // //     output: 'I have created a draft email for you to edit. The draft Id is r5681294731961864018.'
  // //   }
  // console.log("Create Result", createResult);

  return true;
}
