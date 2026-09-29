const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = "MTU1NDIzMDIwMTk4MDgxNzQxOA.GftgZb.nV1Dpa1H7sZtmE9X-mQMX7CZB-hkDTj9GhKzIE";
const CLIENT_ID = "1554230201980817418";
const GUILD_ID = "1554225349829853296";

const commands = [
    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open the JUNIOR ticket panel")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registering /ticket...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("/ticket registered successfully");
    } catch (error) {
        console.error(error);
    }
})();