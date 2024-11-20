import { Interaction } from "discord.js";
import { BotEvent } from "../eventLoader.ts";
import { checkAccess } from "../utils/accessCheck.ts";

const execute = (interaction: Interaction) => {
  if (!interaction.isAutocomplete()) return;
  //if (!checkAccess(interaction.user.id)) {
  if (!checkAccess(interaction.user.id)) {
    interaction.respond([{
      name: "You don't have access.",
      value: "Please remove this bot from your account."
    }])
    return;
  }

  const command = interaction.client.slashCommands.get(interaction.commandName);
  if (!command || !command.autocomplete) return;

  command.autocomplete(interaction);
};

const event: BotEvent = {
  name: "interactionCreate",
  execute,
};
export default event;
