import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "$/commandLoader.ts";
import { config } from "$utils/config.ts";

const languages = [
  "Javascript",
  "VB.NET",
  "TypeScript",
  "Swift",
  "Scala",
  "Rust",
  "Kotlin",
  "Lua",
  "ObjectiveC",
  "OCaml",
  "Pascal",
  "Perl",
  "PHP",
  "Python3",
  "Ruby",
  "Go",
  "Groovy",
  "Haskell",
  "Java",
  "Clojure",
  "D",
  "Dart",
  "F#",
  "C",
  "C#",
  "Bash",
  "C++",
];
type Languages = (typeof languages[number])[];

const gameModes = ["FASTEST", "SHORTEST", "REVERSE"];
type GameModes = (typeof gameModes[number])[];

const createPrivateClash = async (
  langs: Languages,
  gamemode: GameModes,
): Promise<string | false> => {
  const uid = config.CLASHOFCODE_KEY.substring(0, 7);
  const token = config.CLASHOFCODE_KEY;
  let publicHandle = "";

  try {
    const req = await fetch(
      "https://www.codingame.com/services/ClashOfCode/createPrivateClash",
      {
        "headers": {
          "Content-Type": "application/json;charset=utf-8",
          "Cookie": `rememberMe=${token}`,
        },
        "body": JSON.stringify([uid, langs, gamemode]),
        "method": "POST",
      },
    );
    const json = await req.json();
    publicHandle = json.publicHandle;

    if (!publicHandle) throw Error("No public handle.");
  } catch (e) {
    console.error("Coc: ", e);
    return false;
  }

  return publicHandle;
};

const startClashByHandle = async (clash: string) => {
  const uid = config.CLASHOFCODE_KEY.substring(0, 7);
  const token = config.CLASHOFCODE_KEY;

  try {
    const req = await fetch(
      "https://www.codingame.com/services/ClashOfCode/startClashByHandle",
      {
        "headers": {
          "Content-Type": "application/json;charset=utf-8",
          "Cookie": `rememberMe=${token}`,
        },
        "body": JSON.stringify([uid, clash]),
        "method": "POST",
      },
    );
    if (!req.ok) throw Error("Error starting game.");
  } catch (e) {
    console.error("Coc: ", e);
    return false;
  }
  return true;
};

const submitCode = async (
  clashId: string,
  language: Languages[number],
): Promise<boolean> => {
  const uid = config.CLASHOFCODE_KEY.substring(0, 7);
  const token = config.CLASHOFCODE_KEY;
  console.log(language);

  try {
    const session = await fetch(
      "https://www.codingame.com/services/ClashOfCode/startClashTestSession",
      {
        "headers": {
          "Content-Type": "application/json;charset=utf-8",
          "Cookie": `rememberMe=${token}`,
        },
        "body": JSON.stringify([uid, clashId]),
        "method": "POST",
      },
    );
    const gameHandle = await (await session.json()).handle;
    if (!gameHandle) throw Error("No game handle.");

    const res = await fetch(
      "https://www.codingame.com/services/TestSession/submit",
      {
        "headers": {
          "Content-Type": "application/json;charset=utf-8",
          "Cookie": `rememberMe=${token}`,
          "Referer": `https://www.codingame.com/ide/${gameHandle}`,
        },
        "body": JSON.stringify([gameHandle, {
          "code": "/* i'm not participating :) */",
          "programmingLanguageId": language,
        }, null]),
        "method": "POST",
      },
    );

    if (!res.ok || res.status !== 200) throw Error("not right status code :(");
  } catch (e) {
    console.error("Coc:", "Something went wrong with submitting code: ", e);
    return false;
  }

  return true;
};

const command: SlashCommand = {
  inDm: true,
  permissions: "everywhere",

  command: new SlashCommandBuilder()
    .setName("coc")
    .setDescription("Start clash of code games from discord!"),

  execute: async (interaction) => {
    const languages = ["Javascript"];

    const clash = await createPrivateClash(languages, []);
    if (!clash) {
      await interaction.reply({
        content: `Something went wrong with creating a clash.`,
        ephemeral: true,
      });
      return;
    }

    const startButton = new ButtonBuilder()
      .setCustomId(`${command.command.name}_${clash}_start`)
      .setLabel("Start game")
      .setStyle(ButtonStyle.Secondary);
    const submitButton = new ButtonBuilder()
      .setCustomId(
        `${command.command.name}_${clash}_submit_${
          languages.length === 0 ? "C++" : languages[0]
        }`,
      )
      .setLabel("Start game")
      .setStyle(ButtonStyle.Secondary);

    await interaction.reply({
      content: `https://www.codingame.com/clashofcode/clash/${clash}`,
      components: [new ActionRowBuilder<ButtonBuilder>()
        .addComponents(startButton, submitButton)],
    });
  },

  button: async (interaction) => {
    const id = interaction.customId.split("_");
    const clashId = id[1];
    const command = id[2];

    if (command === "start") {
      const result = await startClashByHandle(clashId);
      await interaction.reply({
        content: result
          ? "Start signal sent."
          : "Something went wrong with sending the start signal.",
        ephemeral: true,
      });
      return;
    } else if (command === "submit") {
      const language = id[3];
      const result = await submitCode(clashId, language);
      await interaction.reply({
        content: result
          ? "Submitted code."
          : "Something went wrong with submitting code.",
        ephemeral: true,
      });
    }
  },
};

export default command;
