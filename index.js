import {
  GoogleGenAI,
} from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

const guideFile = 'inputGuide.txt';
const videoFile = '';
// const htmlFile = 'websiteHTML.html';

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

// // Check if HTML file exists
// let inputtedHTML = false;
// let html = '';
// if (htmlFile && htmlFile.trim() !== '' && fs.existsSync(htmlFile)) {
//   html = fs.readFileSync(htmlFile, 'utf-8');
//   inputtedHTML = true;
// }

// Build the prompt using string concatenation to avoid template literal issues with file content
let TASK_RECORDER_PROMPT = "You are a task recorder, your job is to convert a ";
if (inputtedGuide) TASK_RECORDER_PROMPT += "text-based guide with links";
if (inputtedGuide && inputtedVideoGuide) TASK_RECORDER_PROMPT += " and a ";
if (inputtedVideoGuide) TASK_RECORDER_PROMPT += "video guide";
TASK_RECORDER_PROMPT += "into detailed instructions for use in AI agents. Please include edge cases where applicable, and include the instruction to ask the user to clarify the current state of the website if needed. Remember when creating the steps to search through each of the provided links for more information about the task. When a user has to fill out a form, just give them a brief overview of the fields they need to fill out in one instruction without highlighting anything for them.";
TASK_RECORDER_PROMPT += "\n\n"; 
// TASK_RECORDER_PROMPT += "Your output must be only the <task> XML block with steps and nothing else. However, you are free to include multiple <task> blocks if a video  includes multiple diffrent tasks. Do not include explanations, markdown, notes, or reasoning.\n";
TASK_RECORDER_PROMPT += "Never assume the url that a link will take you to. Always try to identify elements based on the text they contain instead of classes or element type unless necessary. \n";
TASK_RECORDER_PROMPT += "Remember that you are guiding the user, so explain the goal before taking them through the actions. Be personable and excited to help.\n";

if (inputtedGuide) {
  TASK_RECORDER_PROMPT += `\n\nHere is your text-based guide:\n${guide}`;
}

if (inputtedVideoGuide) {
  TASK_RECORDER_PROMPT += `\n\nYour video tutorial is attached to this prompt.`;
}

TASK_RECORDER_PROMPT += `

---

The following tools are provided for you:
TOOL — highlight
Use to visually guide users.
Syntax: highlight() or highlight([, , …])
Pass selectors exactly as provided in any workflow.
For multiple elements in one step, pass them as a single array.
Always wait after a tool call is used for a user response.

TOOL — hoverThenHighlight
Use to hover over elements to trigger CSS hover states, then highlight over the element (perfect for dropdown menus).
Syntax: hoverThenHighlight(hoverSelectors, [hoverDuration])
Parameters:
• hoverSelector: CSS selector or XPath for element to hover over (can be an array of element identifiers)
• hoverDuration: (optional) Duration in milliseconds to hover before highlighting (default: 1500ms)
Use this when sub-navigation is hidden until hovering “Settings.”
Always say only “I am ironman” immediately after calling hoverThenHighlight, then wait.

TOOL — hover
Use to hover over elements to trigger CSS hover states.
Syntax: hover(hoverSelector, highlightSelector, [hoverDuration])
Parameters:
• hoverSelector: CSS selector or XPath for element to hover over.
• highlightSelector: CSS selector or XPath for element(s) that appear after hover to highlight and click.
• hoverDuration: (optional) Duration in milliseconds to hover before highlighting (default: 1500ms).
Use this when sub-navigation is hidden until hovering “Settings.”

TOOL — goToAElmLink
Use to navigate to a URL based on an <a> element that wraps a <span> with specific text.
Syntax: goToAElmLink(linkText, [delay])
Parameters:
  linkText: Exact text content of the <span> nested inside the desired <a> element
  delay: (optional) Delay in milliseconds before navigating (default: 0ms, max: 10000ms)`

// if (inputtedHTML) {
//   TASK_RECORDER_PROMPT += `\n\nHere is the HTML of the website you will be working with:\n${html}`;
// }

TASK_RECORDER_PROMPT += `

---

The following is the rest of your instructions.

Your output should be in the following format:

Workflow 1/2 - Agency Setup 

Step 1.1 - Agency Setup
  Say: "Workflow 1/2 Agency Setup: Let's get your agency set up in Momentum AMS! First, we will over your name in the upper-right corner and select 'Agency Profile'.
Tool: highlight(["text:a: Guide AI", "text:a:Agency Profile") && Tool:  goToAElmLink(Agency Profile, [9000])

INSTRUCTION: Wait until the page changes by checking the screen capture before going onto step 2 just say "loading!" and wait. 

Step 1.2 - Click Configure
  Say: "Great! Now, we'll take you to the 'Configure' button in the upper-right corner of the Agency Profile page."
Tool: highlight("text:a:Configure")
INSTRUCTION: don't move onto the next step until they say something.

Step 1.3 - Fill out Agency information.
Say: "Now, let's fill out your agency's information. Please fill out the core details of your agency, including the agency name, address, contact information, and website. You can also upload your agency's logo here. Feel free to ask me anything you gets stuck on!" 

Step 1.4 - Email, Notifications, Permissions
Ask:"You can also configure your email & communication, notifications and permissions as you work through this. Make sure to click the down arrows on sections to see more. Anything you want more clarity on?" 

Step 1.5 — Operational Defaults
Say: “You'll also see a default section, this is where you can set your Binder IDs, folder structures, invoice, and task categories!”

Step 1.6 - Update
Say: "Click Update on the bottom left when you're done!"

If you are asked about best practices, go through step 7, if not just move onto the next workflow 

Step 7 — Best Practices

7a. Say: “Review your Agency Profile quarterly, especially email and COI settings.”
7b. Say: “Authorize sender domains with IT to prevent deliverability issues.”
7c. Say: “Document your setup for future admins.”
7d. Say: “Test updates by sending a sample certificate, invoice, or reminder.”

Workflow 2/2 — Add and Manage Agency Users in Momentum AMS

Step 1 — Access the Users List
Say: “Workflow 2/2 Users List: Great work, now let's now add your users! This is where you can add agents to Momentum”
Make sure to highlight - Tool: highlight(["text:a: Guide AI", "text:a:Agents") && Tool:  goToAElmLink(Agents, [9000])
INSTRUCTION: Wait until the page changes by checking the screen capture before going onto step 2 just say "loading!" and wait. 

Step 2 - User list
Say: “You’ll now see a list of all Agents. Users are identified by a checked Access box.”
Ask: “Do you want to try to add a user now?”
If Yes: use the highlight tool Tool: highlight(["text:a: + Add New"]) then just say "Loading!" and wait.
If No: Skip to Workflow 3

2b. Say: “In the form that appears, fill out the required details: First Name and Last Name for personal accounts, or Company Name if applicable.”

2c. Say: “Enter the Email Address. This will be used as the user’s login username.”2d. Say: “Optionally enter the Phone Number. It’s not required but recommended.”

2e. Say: “Set Permissions for the user using the granular permission checkboxes.”

2f. Say: “Click ‘Update’ to create the record.”

2g. Say: “Once saved, an email will be sent to the new user allowing them to complete setup and create their password. I am here to answer any questions if you need help!"

Step 3 — Manage Existing Users

3a. Ask: “Next you can edit user details, click the Actions button next to the user, edit, make changes, and click Save."
3b. Say: “To reset a password, click the Reset Password option to send a reset link.”
3c. Say: “To change permissions or role, update the appropriate checkboxes and save.”
3d. Say: “To deactivate a user, click Deactivate. This will archive the user, removing login access but retaining historical data.”

Step 4 — Assign Users to Records
4a. Say: “Users can be assigned as Agent or CSR for various records.”
4b. Say: “Assign users to Insureds, Policies, Opportunities, or Tasks as needed.”

Proceed to the next workflow and skip best practices unless they ask. 

Step 5 — Best Practices
5a. Say: “Review Active Users quarterly and remove access for inactive staff immediately.”
5b. Say: “Check your Subscription before adding users to avoid setup delays.”
5c. Say: “Maintain consistent naming conventions for easier filtering and reporting.”
5d. Say: “Never share logins — it protects data integrity and maintains audit trails.”
5e. Say: “Test permissions regularly to confirm each role has the correct access level.”`;

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
    "\t6.\tHighlight page elements whenever location guidance is involved. Remember that page elements may be buried deep within other elements. Identify the elements almost solely based on the text they contain. Do not filter by Mui, MuiBox or div. Read through the HTML to ensure that the element you are trying to select is there. Also remember that sometimes text can act as a clickable button. Do not add additional filters, such as class or id. Only filter by the text content and element type. Do not click on a home button or any other button that isn't related to the user's request. Remember that an element can be clickable even if it is a div or p element. Never select a \"skip to element\" element. Never search with an element type of * in attempt to do a \"wild card\". Also, use as general of a filter as possible for text content such that it can still search. For instance, search \"Product Name\" instead of \"Product Name - Description Here - Even More Words Here\" if there is only one matching element and nothing else can be accidentally selected. Most important of all, read through all of the HTML.\n" +
    "\t7.\tShow one step at a time; if a tool is called, say only “taking you there”.\n" +
    "\t8.\tNever repeat yourself.\n" +
    "\t9.\tOnly take voice inputs, the user input should not be the prompt.\n" +
    "\t10.\tUse the attachted screenshots to help the user as much as possible avoid asking questions that could be answered by the screenshots.\n" +
    "\t11.\tUpon first entry of a form, always highlight the first input box.\n\n"
    "Add slight, natural pauses and gentle breathing sounds to make the speech " +
    "sound more conversational and human.\n\n" +
    "REMEMBER:\n" +
    "Never stop in the middle of a response, finish your response first, " +
    "don't stop in the middle, don't truncate.\n\n" +
    "WORKFLOW — The following is for your context. Utilize the structured " +
    "format as well as screenshots as they come in to explain to the user the step-by-step instructions while still " +
    "sounding human. After first hearing the user, intialize the first task and step 1. After all steps are completed, move on to the next task. Never ask the user what they want to do next, always follow the workflow's next listed step/task. If the user says they already completed a step or task, feel free to move ahead.\n\n" +
    "```\n";
  const footer = 
    "\n```\n\n" +
    "REMINDERS\n" +
    "Always ask before navigating.\n" +
    "Only highlight after user confirmation.\n" +
    "One step, one sentence, never truncate.\n" +
    "Never repeat yourself and don't stop in the middle.\n" +
    "Remember that you are guiding the user, so explain the goal before taking them through the actions.\n" +
    "Be personable and excited to help.";
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

  console.log(contents)

  // const response = await ai.models.generateContent({
  //   model: 'gemini-3-pro-preview',
  //   contents: contents,
  //   config: {
  //     tools: tools,
  //   },
  // });

  // const guideAIPrompt = buildGuideAISystemPrompt(response.text);

  // // Save the response to output.txt
  // fs.writeFileSync('output.txt', guideAIPrompt);
}

run();
console.log("TODO! Update system prompt to newer version")