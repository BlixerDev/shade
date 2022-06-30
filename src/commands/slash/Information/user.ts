import { Interaction, Structures } from "detritus-client";
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Embed } from "detritus-client/lib/utils";

import axios from "axios";

import { DiscordUserFlags, DiscordStatus } from "../../../assets/constants";

import { BaseSlashCommand } from "../../baseCommand";

interface CommandArgs {
    target?: Structures.User | Structures.Member;
}

export const COMMAND_NAME = "user";

export default class UserCommand extends BaseSlashCommand<CommandArgs> {
    name = COMMAND_NAME;
    description = "Check information about a Discord user";

    constructor() {
        super({
            options: [
                {
                    name: "target",
                    description: "Select a target, or ignore to check your own profile",
                    required: false,
                    type: ApplicationCommandOptionTypes.USER,
                }
            ]
        });
    }

    async run(context: Interaction.InteractionContext, args: CommandArgs) {
        const target = args.target || context.user;

        const data = await axios.get(`https://discord.com/api/users/${target.id}`, {
            headers: {
                Authorization: `Bot ${context.client.token}`
            }
        }).then(res => res.data);

        const flags: Array<string> = [];
        for (const key in DiscordUserFlags) {
            if (target.hasFlag(parseInt(key))) {
                flags.push((DiscordUserFlags as any)[key]);
            }
        }

        const embed = new Embed;

        embed.setTitle(target.tag);

        embed.setThumbnail(target.avatarUrlFormat("png", 1024));

        embed.setImage(`https://cdn.discordapp.com/banners/${target.id}/${data.banner}.${data.banner?.startsWith("a_") ? "gif" : "png"}?size=1024`);

        embed.addField("Default", `
**ID:** ${target.id}
**Type:** ${target.bot ? "Bot" : "User"}
**Flags:** ${flags.length ? flags.join(" ") : "None"}
**Created at:** <t:${Math.ceil(target.createdAtUnix / 1000)}>
            `, true);

        if (context.guild && context.guild.members.cache.has(target.id)) {
            const member = context.guild.members.cache.get(target.id);

            embed.addField(`Server`, `
**Nick:** ${member?.nick || "None"}
**Roles:** ${member?.roles.sort((a, b) => b!.position - a!.position).filter(role => role?.id != context.guild?.id).map(role => role?.mention).join(" ") || `None`}
**Boosting:** ${member?.premiumSince ? `Since <t:${Math.ceil(member!.premiumSinceUnix / 1000)}>` : "No"}
**Joined at:** <t:${Math.ceil(member!.joinedAtUnix / 1000)}>
            `, true);

            embed.addField("Status", `
**Status:** ${member?.presence?.status ? (DiscordStatus as any)[member?.presence?.status] : "Offline or Invisible"}
**Custom status:** ${target.presence?.activity?.isCustomStatus ? target.presence?.activity?.state : "None"}
            `);
        }

        embed.addField("Links", `
**Avatar:** [Default](https://cdn.discordapp.com/avatars/${target.id}/${data.avatar}.${data.avatar?.startsWith("a_") ? "gif" : "png"}?size=1024)
**Banner:** ${data.banner ? `[Default](https://cdn.discordapp.com/banners/${target.id}/${data.banner}.${data.banner?.startsWith("a_" ? "gif" : "png")}?size=1024)` : data.banner_color ? `No custom banner, color is ${data.banner_color.toUpperCase()}` : "None"}
        `);

        context.editOrRespond({ embeds: [embed] });
    }
}