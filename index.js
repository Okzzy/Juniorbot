const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const client = new Client({
intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
]
});

// =========================
// CONFIG
// =========================

const TOKEN = process.env.TOKEN;
console.log("TOKEN EXISTS:", !!process.env.TOKEN);
console.log("TOKEN LENGTH:", process.env.TOKEN?.length);

const TICKET_CATEGORY_ID = "1554238724064415854";

const STAFF_ROLES = [
    "1554225349829853300", // Mod
    "1554225349829853301", // Head Mod
    "1554225349829853302"  // Streamer
];

// =========================
// BOT READY
// =========================

client.once("ready", () => {
// =========================
// WELCOME + AUTO ROLE
// =========================

const WELCOME_CHANNEL_ID = "1554225351163650132";
const AUTO_ROLE_ID = "1554225349829853297";

client.on("guildMemberAdd", async (member) => {

    try {

        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);

        if (role) {
            await member.roles.add(role);
        }

        const welcomeChannel = member.guild.channels.cache.get(
            WELCOME_CHANNEL_ID
        );

        if (welcomeChannel) {

            await welcomeChannel.send(
                `Welcome ${member} to **${member.guild.name}**!`
            );

        }

        console.log(`NEW MEMBER: ${member.user.tag}`);

    } catch (error) {

        console.error("WELCOME ERROR:", error);

    }

});
    console.log("BOT STARTED");
});

// =========================
// INTERACTIONS
// =========================

client.on("interactionCreate", async (interaction) => {

    console.log("INTERACTION RECEIVED");

    try {

        // ==========================================
        // /ticket COMMAND
        // ==========================================

        if (interaction.isChatInputCommand()) {

            if (interaction.commandName === "ticket") {

                const embed = new EmbedBuilder()
                    .setTitle("JUNIOR | Support")
                    .setDescription(
                        "Need help?\n\n" +
                        "Select a category below to open a private ticket."
                    );

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("ticket_category")
                    .setPlaceholder("Select a category")
                    .addOptions([
                        {
                            label: "Support",
                            description: "Get help from our staff",
                            value: "support",
                            emoji: "🛠️"
                        },
                        {
                            label: "Report",
                            description: "Report a member or an issue",
                            value: "report",
                            emoji: "🚨"
                        },
                        {
                            label: "Other",
                            description: "Something else",
                            value: "other",
                            emoji: "💬"
                        }
                    ]);

                const row = new ActionRowBuilder()
                    .addComponents(menu);

                await interaction.reply({
                    embeds: [embed],
                    components: [row]
                });

                console.log("TICKET PANEL SENT");

                return;
            }
        }

        // ==========================================
        // TICKET CATEGORY SELECTED
        // ==========================================

        if (interaction.isStringSelectMenu()) {

            if (interaction.customId !== "ticket_category") return;

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;

            // Create safe ticket name
            const username = interaction.user.username
                .toLowerCase()
                .replace(/[^a-z0-9-_]/g, "");

            const ticketName = `ticket-${username}`;

            // Check if user already has a ticket
            const existingTicket = guild.channels.cache.find(
                channel => channel.name === ticketName
            );

            if (existingTicket) {

                await interaction.editReply({
                    content: `You already have an open ticket: ${existingTicket}`
                });

                return;
            }

            const category = interaction.values[0];

            // Create ticket channel
            const channel = await guild.channels.create({

                name: ticketName,

                type: ChannelType.GuildText,

                parent: TICKET_CATEGORY_ID,

                permissionOverwrites: [

                    // Everyone cannot see the ticket
                    {
                        id: guild.roles.everyone.id,

                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },

                    // Ticket creator
                    {
                        id: interaction.user.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },

                    // Staff
                    ...STAFF_ROLES.map(roleId => ({

                        id: roleId,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels
                        ]

                    }))
                ]
            });

            // ==========================================
            // BUTTONS
            // ==========================================

            const closeButton = new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("Close Ticket")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Danger);

            const claimButton = new ButtonBuilder()
                .setCustomId("claim_ticket")
                .setLabel("Claim Ticket")
                .setEmoji("👤")
                .setStyle(ButtonStyle.Primary);

            const renameButton = new ButtonBuilder()
                .setCustomId("rename_ticket")
                .setLabel("Rename Ticket")
                .setEmoji("📌")
                .setStyle(ButtonStyle.Secondary);

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    closeButton,
                    claimButton,
                    renameButton
                );

            // ==========================================
            // TICKET EMBED
            // ==========================================

            const embed = new EmbedBuilder()
                .setTitle(`JUNIOR | ${category.toUpperCase()}`)
                .setDescription(
                    `Welcome ${interaction.user}\n\n` +
                    `You have opened a **${category}** ticket.\n\n` +
                    "Please describe your issue and a staff member will assist you."
                );

            await channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
                components: [buttonRow]
            });

            await interaction.editReply({
                content: `Your ticket has been created: ${channel}`
            });

            console.log("TICKET CREATED");

            return;
        }

        // ==========================================
        // BUTTONS
        // ==========================================

        if (interaction.isButton()) {

            // ==========================================
            // CHECK STAFF
            // ==========================================

            const hasStaffRole = STAFF_ROLES.some(roleId =>
                interaction.member.roles.cache.has(roleId)
            );

            // ==========================================
            // CLOSE TICKET
            // ==========================================

            if (interaction.customId === "close_ticket") {

                if (!hasStaffRole) {

                    await interaction.reply({
                        content: "Only staff members can close this ticket.",
                        ephemeral: true
                    });

                    return;
                }

                await interaction.reply(
                    "🔒 This ticket will be closed in 5 seconds..."
                );

                setTimeout(async () => {

                    await interaction.channel.delete().catch(() => {});

                }, 5000);

                return;
            }

            // ==========================================
            // CLAIM TICKET
            // ==========================================

            if (interaction.customId === "claim_ticket") {

                if (!hasStaffRole) {

                    await interaction.reply({
                        content: "Only staff members can claim tickets.",
                        ephemeral: true
                    });

                    return;
                }

                const messages = await interaction.channel.messages.fetch({
                    limit: 20
                });

                const botMessage = messages.find(
                    message =>
                        message.author.id === client.user.id &&
                        message.components.length > 0
                );

                if (!botMessage) {

                    await interaction.reply({
                        content: "Could not find the ticket controls.",
                        ephemeral: true
                    });

                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle("JUNIOR | Ticket")
                    .setDescription(
                        `👤 This ticket has been claimed by **${interaction.user}**.\n\n` +
                        "Please wait while a staff member helps you."
                    );

                await interaction.reply({
                    embeds: [embed]
                });

                return;
            }

            // ==========================================
            // RENAME TICKET
            // ==========================================

            if (interaction.customId === "rename_ticket") {

                if (!hasStaffRole) {

                    await interaction.reply({
                        content: "Only staff members can rename tickets.",
                        ephemeral: true
                    });

                    return;
                }

                const modal = new ModalBuilder()
                    .setCustomId("rename_ticket_modal")
                    .setTitle("Rename Ticket");

                const nameInput = new TextInputBuilder()
                    .setCustomId("ticket_name")
                    .setLabel("New ticket name")
                    .setPlaceholder("Example: ticket-support-tobias")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(90);

                const inputRow = new ActionRowBuilder()
                    .addComponents(nameInput);

                modal.addComponents(inputRow);

                await interaction.showModal(modal);

                return;
            }
        }

        // ==========================================
        // RENAME MODAL
        // ==========================================

        if (interaction.isModalSubmit()) {

            if (interaction.customId !== "rename_ticket_modal") return;

            const hasStaffRole = STAFF_ROLES.some(roleId =>
                interaction.member.roles.cache.has(roleId)
            );

            if (!hasStaffRole) {

                await interaction.reply({
                    content: "Only staff members can rename tickets.",
                    ephemeral: true
                });

                return;
            }

            let newName = interaction.fields.getTextInputValue("ticket_name");

            // Make name Discord-friendly
            newName = newName
                .toLowerCase()
                .replace(/[^a-z0-9-_]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

            if (!newName) {

                await interaction.reply({
                    content: "Please enter a valid ticket name.",
                    ephemeral: true
                });

                return;
            }

            // Make sure it starts with ticket-
            if (!newName.startsWith("ticket-")) {
                newName = `ticket-${newName}`;
            }

            await interaction.channel.setName(newName);

            await interaction.reply({
                content: `📌 Ticket renamed to **${newName}**.`
            });

            return;
        }

    } catch (error) {

        console.error("ERROR:", error);

        if (!interaction.replied && !interaction.deferred) {

            await interaction.reply({
                content: "Something went wrong. Please contact staff.",
                ephemeral: true
            }).catch(() => {});

        }
    }
});

// =========================
// LOGIN
// =========================

client.login(TOKEN);
