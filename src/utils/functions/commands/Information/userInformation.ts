import { Interaction, Structures } from "detritus-client";
import { MessageFlags } from "detritus-client/lib/constants";
import { Embed } from "detritus-client/lib/utils";

import { DiscordStatus, DiscordUserFlags } from "../../../../assets/constants";
import { escapeBold } from "../../escapeBold";

import { toTitleCase } from "../../toTitleCase";

export async function userInformation(context: Interaction.InteractionContext, target: Structures.User | Structures.Member, ephemeral?: boolean): Promise<any> {
    const data = await context.rest.fetchUser(target.id);

    const flags: Array<string> = [];
    for (const key in DiscordUserFlags) {
        if (target.hasFlag(parseInt(key))) {
            flags.push((DiscordUserFlags as any)[key]);
        }
    }

    const embed = new Embed;

    embed.setTitle(target.tag);

    embed.setThumbnail(`${target.avatarUrl.slice(0, -3)}${target.avatar?.startsWith("a_") ? "gif" : "png"}?size=1024`);

    embed.setImage(`https://cdn.discordapp.com/banners/${target.id}/${data.banner}.${data.banner?.startsWith("a_") ? "gif" : "png"}?size=1024`);

    embed.addField("Default", `
**ID:** ${target.id}
**Type:** ${target.bot ? "Bot" : "User"}
**Flags:** ${flags.length ? flags.join(" ") : "None"}
**Created at:** <t:${Math.ceil(target.createdAtUnix / 1000)}>
            `, true);

    const avatars = [`[Default](${target.avatarUrl.slice(0, -3)}${target.avatar?.startsWith("a_") ? "gif" : "png"}?size=1024)`];

    if (context.guild && context.guild.members.cache.has(target.id)) {
        const member = context.guild.members.cache.get(target.id);

        embed.addField(`Server`, `
**Nick:** ${member?.nick ? escapeBold(member?.nick) : "None"}
**Boosting:** ${member?.premiumSince ? `Since <t:${Math.ceil(member!.premiumSinceUnix / 1000)}>` : "No"}
**Joined at:** <t:${Math.ceil(member!.joinedAtUnix / 1000)}>
            `, true);

        embed.addField(`Roles`, `
${member?.roles.sort((a, b) => b!.position - a!.position).filter(role => role?.id != context.guild?.id).map(role => role?.mention).join(" ") || `None`}
            `);

        embed.addField("Status", `
${member?.presence ? Object.keys(member?.presence?.clientStatus as object).map(status => `**${toTitleCase(status)}:** ${DiscordStatus[(member?.presence?.clientStatus as any)[status]]}`).join("\n") : `**Right now:** ${DiscordStatus["offline"]}`}
**Custom:** ${target.presence?.activity?.isCustomStatus ? target.presence?.activity?.state : "None"}
            `);

        if (member?.hasGuildAvatar) {
            avatars.push(`[Member](${member?.avatarUrl.slice(0, -3)}${member?.avatar?.startsWith("a_") ? "gif" : "png"}?size=1024)`);
        }
    }

    embed.addField("Links", `
**Avatar:** ${avatars.join(" | ")}
**Banner:** ${data.banner ? `[Default](https://cdn.discordapp.com/banners/${target.id}/${data.banner}.${data.banner?.startsWith("a_" ? "gif" : "png")}?size=1024)` : data.bannerColor ? `No custom banner, color is ${data.bannerColor.toUpperCase()}` : "None"}
        `);

    context.editOrRespond({ embeds: [embed], flags: ephemeral ? MessageFlags.EPHEMERAL : 0 });
}