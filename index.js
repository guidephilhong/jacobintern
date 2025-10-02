import {
  GoogleGenAI,
} from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

const guideFile = '';
const videoFile = 'https://youtu.be/dqK-L0Oiimg';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Read guide file only if guideFile is not empty
let guide = '';
let inputtedGuide = false;
if (guideFile && guideFile.trim() !== '') {
  guide = fs.readFileSync(guideFile, 'utf-8');
  inputtedGuide = true;
}

// Check if a video guide is provided
let inputtedVideoGuide = videoFile && videoFile.trim() !== '';

// Build the prompt using string concatenation to avoid template literal issues with file content
let TASK_RECORDER_PROMPT = "You are a task recorder, your job is to convert a ";
if (inputtedGuide) TASK_RECORDER_PROMPT += "text-based guide with links";
if (inputtedGuide && inputtedVideoGuide) TASK_RECORDER_PROMPT += " and a ";
if (inputtedVideoGuide) TASK_RECORDER_PROMPT += "video guide";
TASK_RECORDER_PROMPT += "into detailed instructions in the form of structured HTML outputs for use in AI agents. Please include edge cases where applicable, and include the instruction to ask the user to clarify the current state of the website if needed. Remember when creating the steps to search through the provided links for more information about the task.";
TASK_RECORDER_PROMPT += "\n\n"; 
TASK_RECORDER_PROMPT += "Your output must be only the <task> XML block with steps and nothing else. However, you are free to include multiple <task> blocks if a video  includes multiple diffrent tasks. Do not include explanations, markdown, notes, or reasoning.";

if (inputtedGuide) {
  TASK_RECORDER_PROMPT += `\n\nHere is your text-based guide:\n${guide}`;
}

if (inputtedVideoGuide) {
  TASK_RECORDER_PROMPT += `\n\nYour video tutorial is attached to this prompt.`;
}

TASK_RECORDER_PROMPT += `

The following is the rest of your instructions.

Your output should be in the following format:
<task name="Send Certificate"><step step_num=1><instruction val="Open the insured dashboard"/><ui_action val="Click button with shopping cart symbol"></step>...</task>

Here is a completed example for a different website:

<task name="Send Certificate for Insured or Commercial Line">

  <step step_num="1">
    <instruction val="Ask: Is the insured already in the system?" />
    <instruction val="If yes: tell them to search via top-left bar and highlight search bar." />
    <ui_action val="#navigationSearchTermInput" />
    <instruction val="If no: say 'taking you there now', then highlight Insureds → Add New." />
    <ui_action val="#nav-insureds-click .cursor-pointer span:last-child" />
    <ui_action val="[url='/Insureds/Insert']" />
    <instruction val="Tell them to fill in insured details." />
  </step>

  <step step_num="2">
    <instruction val="Ask: Is there an active policy for this insured?" />
    <instruction val="If no: highlight Add New in Policies section. Only say 'taking you there now'." />
    <ui_action val="//a[contains(@href, '/Policies/Insert') and contains(@href, '/Insureds/Details/')]" />
    <instruction val="Confirm within the policy creation: add policy, fill out the coverages tab, and input required data." />
  </step>

  <step step_num="3">
    <instruction val="Ask: Have you already created a master certificate?" />
    <instruction val="If no: say 'taking you there now', then highlight Documents → Certificates (Master) → Add New." />
    <ui_action val="//span[contains(text(), 'Documents')]" />
    <ui_action val="//span[contains(text(), 'Certificates (Master')]" />
    <ui_action val="//a[contains(text(), 'Add New')]" />
    <instruction val="Confirm within master certificate creation: choose template (usually ACORD 25), name the certificate, select applicable policies, confirm coverages auto-fill, choose signature, click save." />
  </step>

  <step step_num="4">
    <instruction val="Ask: Is this for an additional insured or a certificate holder?" />
    <instruction val="If additional insured: highlight Additional Interests tab." />
    <ui_action val="//span[contains(text(), 'Additional Interests')]" />
    <ui_action val="[url='/AdditionalInterests/Insert']" />
    <instruction val="Search existing holders first. After adding, tell them to click Actions next to added interest → Send Certificate. (Skip Step 5 when done.)" />
    <instruction val="If certificate holder: proceed to Step 5." />
  </step>

  <step step_num="5">
    <instruction val="Highlight Send Certificate icon." />
    <ui_action val="//a[contains(text(), 'Send Certificate')]" />
    <instruction val="Choose holder or highlight Add New for a new holder." />
    <ui_action val="id='ctl00_ContentPlaceHolder1_lnkInsert'" />
    <instruction val="For new holder: enter name, address, and contact info." />
    <instruction val="Select relevant master certificate." />
    <instruction val="Click Preview to review formatting." />
    <instruction val="Click Send Certificate or fax the document." />
  </step>

</task>`;

TASK_RECORDER_PROMPT = TASK_RECORDER_PROMPT.trim();


function buildGuideAISystemPrompt(html) {
  const header = 
    "You are Guide AI. Help users complete tasks in a website.\n\n" +
    "GLOBAL RESPONSE RULES\n" +
    "\t1.\tAnswer every question in ≤ 10 words (one sentence).\n" +
    "\t2.\tSpeak calmly, evenly, never twice in a row.\n" +
    "\t3.\tNever interrupt yourself—finish, then await the next user input.\n" +
    "\t4.\tOne request at a time; ignore mid-response interruptions.\n" +
    "\t5.\tUse a question-first coaching style: ask, wait, then guide.\n" +
    "\t6.\tHighlight page elements whenever location guidance is involved.\n" +
    "\t7.\tShow one step at a time; if a tool is called, say only “taking you there”.\n" +
    "\t8.\tNever repeat yourself.\n" +
    "\t9.\tOnly take voice inputs, the user input should not be the prompt.\n\n" +
    "\t10.\t Use the attachted screenshots to help the user as much as possible avoid asking questions that could be answered by the screenshots.\n\n" +
    "Add slight, natural pauses and gentle breathing sounds to make the speech " +
    "sound more conversational and human.\n\n" +
    "REMEMBER:\n" +
    "Never stop in the middle of a response, finish your response first, " +
    "don't stop in the middle, don't truncate.\n\n" +
    "WORKFLOW — The following is for your context. Utilize the structured " +
    "format as well as screenshots as they come in to explain to the user the step-by-step instructions while still " +
    "sounding human.\n\n" +
    "```\n";
  const footer = 
    "\n```\n\n" +
    "REMINDERS\n" +
    "Always ask before navigating.\n" +
    "Only highlight after user confirmation.\n" +
    "One step, one sentence, never truncate\n" +
    "Never repeat yourself and don't stop in the middle";
  return `${header}${html}${footer}`;
}

async function run() {
  let tools = []
  
  // Add urlContext if a text-based guide is provided
  if (inputtedGuide) {
    tools.push({urlContext: {url: guide}});
  }

  let contents = TASK_RECORDER_PROMPT;

  if (inputtedVideoGuide) {
    contents = [
      contents,
      {
        fileData: {
          fileUri: videoFile,
        }
      }
    ]
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: contents,
    config: {
      tools: tools,
    },
  });

  const guideAIPrompt = buildGuideAISystemPrompt(response.text);

  // Save the response to output.txt
  fs.writeFileSync('output.txt', guideAIPrompt);
}

run();