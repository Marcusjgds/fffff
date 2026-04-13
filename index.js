const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ─── CONFIG ────────────────────────────────────────────────────────────────
const RESULTS_CHANNEL_ID = process.env.RESULTS_CHANNEL_ID || '1493214612345192508';
const TIMEOUT_SECONDS = 120;

// ─── RÔLES PAR RECRUTEMENT ─────────────────────────────────────────────────
// Clé = même nom court que dans RECRUITMENTS ci-dessous
const ROLE_IDS = {
  dirmed:  process.env.ROLE_DIRMED  || '1493253219252441209',
  dirsci:  process.env.ROLE_DIRSCI  || '1493253219252441209',
  dirint:  process.env.ROLE_DIRINT  || '1493253219252441209',
  // Ajoute tes autres rôles ici :
  // poste3: process.env.ROLE_POSTE3 || 'ID_DU_ROLE',
};

// ─── RECRUTEMENTS ──────────────────────────────────────────────────────────
// ⚠️ Les clés ne doivent PAS contenir de _ (underscore) ni de .
const RECRUITMENTS = {
  dirmed: {
    label: 'Directeur Médical',
    description: 'Nous recrutons !',
    color: 0x5865F2,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      'Pourquoi toi et pas un autre pour devenir Directeur Médical ?',
      'Un hôpital fait face à une augmentation brutale de cas de Sepsis. Quelle est la priorité absolue ?',
      'Un patient en détresse respiratoire aiguë nécessite une ventilation. Quelle stratégie est recommandée ?',
      'Quel trouble entraîne une augmentation des D-dimères ?',
      'Quel est le traitement immédiat d\'un arrêt cardiaque ?',
      'Une acidocétose diabétique nécessite quel traitement ?',
      'Quel est le principal mode de transmission de la tuberculose ?',
      'Quel signe évoque une hypertension intracrânienne ?',
      'En cas de ressources limitées (triage catastrophe), on privilégie quoi ?',
      'Quel est le meilleur moyen de réduire les infections nosocomiales ?',
    ],
  },

  dirsci: {
    label: 'Directeur Scientifique',
    description: 'Nous recrutons !',
    color: 0x57F287,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      'Quelle est la caractéristique essentielle d\'une hypothèse scientifique valide ?',
      'Que signifie une p-value < 0,05 ?',
      'Quel est le rôle principal de l\'ADN ?',
      'Quel est le but d\'un essai randomisé contrôlé ?',
      'Quel biais survient quand on ne publie que les résultats positifs ?',
      'Quelle technique permet d\'amplifier l\'ADN ?',
      'Quel test utiliser pour comparer 2 moyennes ?',
      'Quel est le rôle principal d\'un Directeur Scientifique ?',
      'Quelle structure permet aux bactéries de résister aux antibiotiques ?',
      'Quel est le niveau de preuve le plus élevé ?',
      'Quel est le plus grand risque en recherche ?',
      'Pourquoi toi et pas un autre pour devenir Directeur Scientifique ?',
    ],
  },

  dirint: {
    label: 'Directeur d\'Installation',
    description: 'Nous recrutons !',
    color: 0x57F287,
    questions: [
      'Quelles sont vos motivations ?',
      'Votre pseudo Roblox + ID Roblox',
      'Explique ce que représente pour toi le rôle de Directeur d’Installation SCP.',
      'Quelles seraient tes 3 priorités absolues en arrivant sur un site SCP ?',
      'Une brèche de confinement se produit avec plusieurs SCP en liberté. 👉 Décris précisément chaque étape de ta gestion de crise.',
      'Comment gères-tu un SCP de classe Keter extrêmement instable ?',
      'Jusqu’où es-tu prêt à aller dans les tests sur les SCP ?',
      'Toutes les communications sont coupées, le site est en chaos. 👉 Comment reprends-tu le contrôle ?',
      'Pourquoi toi et pas un autre pour devenir Directeur d’Installation SCP ?',
    ],
  },

  // ── Pour ajouter un poste, copie ce bloc et remplis-le ──
  // autreposte: {
  //   label: '🎯 Nom du poste',
  //   description: 'Description courte',
  //   color: 0xFEE75C,
  //   questions: [
  //     'Question 1 ?',
  //     'Question 2 ?',
  //   ],
  // },
};

// ─── SESSIONS ACTIVES ──────────────────────────────────────────────────────
const activeSessions = new Map();

// ─── READY ─────────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// ─── COMMANDE !setup-recrutement ───────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.content === '!setup-recrutement' && message.member?.permissions.has('Administrator')) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Recrutements ouverts')
      .setDescription('Clique sur le bouton ci-dessous pour postuler à un poste disponible sur ce serveur.')
      .setColor(0x5865F2)
      .addFields(
        Object.entries(RECRUITMENTS).map(([, r]) => ({
          name: r.label,
          value: r.description,
          inline: true,
        }))
      )
      .setFooter({ text: `Tu auras ${TIMEOUT_SECONDS} secondes pour répondre à chaque question.` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_recruitment')
        .setLabel('📝 Postuler')
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }
});

// ─── INTERACTIONS ──────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // ── Bouton "Postuler" ──
  if (interaction.isButton() && interaction.customId === 'open_recruitment') {
    if (activeSessions.has(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ Tu as déjà une candidature en cours dans tes messages privés !', ephemeral: true });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('choose_recruitment')
      .setPlaceholder('Choisis un poste...')
      .addOptions(
        Object.entries(RECRUITMENTS).map(([key, r]) => ({
          label: r.label,
          description: r.description,
          value: key,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: '👇 Quel poste t\'intéresse ?',
      components: [row],
      ephemeral: true,
    });
  }

  // ── Select menu : choix du recrutement ──
  if (interaction.isStringSelectMenu() && interaction.customId === 'choose_recruitment') {
    const key = interaction.values[0];
    const recruitment = RECRUITMENTS[key];

    await interaction.update({ content: `✅ Tu as choisi **${recruitment.label}**. Regarde tes messages privés !`, components: [] });

    activeSessions.set(interaction.user.id, {
      recruitmentKey: key,
      guildId: interaction.guildId,
      guildName: interaction.guild.name,
      memberTag: interaction.user.tag,
      memberId: interaction.user.id,
      answers: [],
      currentQuestion: 0,
    });

    try {
      const dmChannel = await interaction.user.createDM();
      await startQuestion(dmChannel, interaction.user.id);
    } catch {
      activeSessions.delete(interaction.user.id);
      await interaction.followUp({ content: '❌ Je ne peux pas t\'envoyer de message privé. Active tes DMs et réessaie.', ephemeral: true });
    }
  }

  // ── Bouton "Envoyer la candidature" ──
  if (interaction.isButton() && interaction.customId.startsWith('submit.')) {
    const userId = interaction.customId.split('.')[1];
    const session = activeSessions.get(userId);
    if (!session) return interaction.reply({ content: '❌ Session introuvable.', ephemeral: true });

    await sendResults(session);
    activeSessions.delete(userId);

    await interaction.update({
      content: '🎉 **Ta candidature a bien été envoyée !** Les recruteurs vont l\'examiner très bientôt. Bonne chance !',
      components: [],
    });
  }

  // ── Bouton "Accepter" ou "Refuser" ──
  if (interaction.isButton() && (interaction.customId.startsWith('accept.') || interaction.customId.startsWith('refuse.'))) {
    // Format des customId : accept.USERID.RECRUITMENTKEY
    const parts = interaction.customId.split('.');
    const action = parts[0];
    const userId = parts[1];
    const recruitmentKey = parts[2];
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    const isAccepted = action === 'accept';

    const color = isAccepted ? 0x57F287 : 0xED4245;
    const emoji = isAccepted ? '✅' : '❌';
    const label = isAccepted ? 'ACCEPTÉ(E)' : 'REFUSÉ(E)';

    // ── Ajouter le rôle si accepté ──
    if (isAccepted && member && recruitmentKey) {
      const roleId = ROLE_IDS[recruitmentKey];
      if (roleId) {
        await member.roles.add(roleId).catch((err) => {
          console.error(`❌ Impossible d'ajouter le rôle ${roleId} :`, err.message);
        });
      } else {
        console.warn(`⚠️ Aucun rôle configuré pour le poste : ${recruitmentKey}`);
      }
    }

    // Mettre à jour l'embed dans le salon résultats
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(color)
      .setFooter({ text: `${emoji} ${label} par ${interaction.user.tag}` });

    await interaction.update({ embeds: [updatedEmbed], components: [] });

    // Notifier le candidat en DM
    try {
      const user = await client.users.fetch(userId);
      const dmEmbed = new EmbedBuilder()
        .setTitle(`${emoji} Décision sur ta candidature`)
        .setDescription(
          isAccepted
            ? '🎉 Félicitations ! Ta candidature a été **acceptée**. Bienvenue dans l\'équipe !'
            : '😔 Ta candidature a été **refusée**. N\'hésite pas à repostuler plus tard !'
        )
        .setColor(color)
        .setTimestamp();

      await user.send({ embeds: [dmEmbed] });
    } catch {
      await interaction.followUp({ content: `⚠️ Impossible d'envoyer un DM à <@${userId}>.`, ephemeral: true });
    }
  }
});

// ─── RÉPONSES EN DM ────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.guild) return;

  const session = activeSessions.get(message.author.id);
  if (!session) return;

  const recruitment = RECRUITMENTS[session.recruitmentKey];
  session.answers.push(message.content);
  session.currentQuestion++;

  if (session.currentQuestion < recruitment.questions.length) {
    await startQuestion(message.channel, message.author.id);
  } else {
    await showSummary(message.channel, message.author.id);
  }
});

// ─── FONCTIONS ─────────────────────────────────────────────────────────────

async function startQuestion(dmChannel, userId) {
  const session = activeSessions.get(userId);
  const recruitment = RECRUITMENTS[session.recruitmentKey];
  const qIndex = session.currentQuestion;
  const question = recruitment.questions[qIndex];
  const total = recruitment.questions.length;

  const embed = new EmbedBuilder()
    .setTitle(`${recruitment.label} — Question ${qIndex + 1}/${total}`)
    .setDescription(`❓ **${question}**`)
    .setColor(recruitment.color)
    .setFooter({ text: `⏱️ Tu as ${TIMEOUT_SECONDS} secondes pour répondre.` });

  await dmChannel.send({ embeds: [embed] });

  // Countdown affiché en live (mise à jour toutes les 10s)
  const countdownMsg = await dmChannel.send(`⏳ **${TIMEOUT_SECONDS}s** restantes...`);
  let remaining = TIMEOUT_SECONDS - 10;

  const countdownInterval = setInterval(async () => {
    if (remaining <= 0) return;
    await countdownMsg.edit(`⏳ **${remaining}s** restantes...`).catch(() => {});
    remaining -= 10;
  }, 10000);

  // Collecter la prochaine réponse
  const collector = dmChannel.createMessageCollector({
    filter: (m) => m.author.id === userId,
    max: 1,
    time: TIMEOUT_SECONDS * 1000,
  });

  collector.on('collect', () => {
    clearInterval(countdownInterval);
    countdownMsg.edit('✅ Réponse enregistrée !').catch(() => {});
  });

  collector.on('end', async (collected) => {
    clearInterval(countdownInterval);
    if (collected.size === 0) {
      await countdownMsg.edit('⌛ Temps écoulé !').catch(() => {});
      const session = activeSessions.get(userId);
      if (session) {
        session.answers.push('*(Pas de réponse — temps écoulé)*');
        session.currentQuestion++;
        const recruitment = RECRUITMENTS[session.recruitmentKey];
        if (session.currentQuestion < recruitment.questions.length) {
          await startQuestion(dmChannel, userId);
        } else {
          await showSummary(dmChannel, userId);
        }
      }
    }
  });
}

async function showSummary(dmChannel, userId) {
  const session = activeSessions.get(userId);
  const recruitment = RECRUITMENTS[session.recruitmentKey];

  const fields = recruitment.questions.map((q, i) => ({
    name: `Q${i + 1}: ${q}`,
    value: session.answers[i] || '*(sans réponse)*',
  }));

  const embed = new EmbedBuilder()
    .setTitle('📋 Résumé de ta candidature')
    .setDescription(`Voici tes réponses pour le poste **${recruitment.label}**. Vérifie bien avant d'envoyer !`)
    .setColor(recruitment.color)
    .addFields(fields)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`submit.${userId}`)
      .setLabel('📨 Envoyer ma candidature')
      .setStyle(ButtonStyle.Success)
  );

  await dmChannel.send({ embeds: [embed], components: [row] });
}

async function sendResults(session) {
  const guild = await client.guilds.fetch(session.guildId).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(RESULTS_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error('❌ Salon résultats introuvable. Vérifiez RESULTS_CHANNEL_ID.');
    return;
  }

  const recruitment = RECRUITMENTS[session.recruitmentKey];
  const fields = recruitment.questions.map((q, i) => ({
    name: `Q${i + 1}: ${q}`,
    value: session.answers[i] || '*(sans réponse)*',
  }));

  const embed = new EmbedBuilder()
    .setTitle(`📥 Nouvelle candidature — ${recruitment.label}`)
    .setDescription(`Candidat : <@${session.memberId}> (\`${session.memberTag}\`)`)
    .setColor(recruitment.color)
    .addFields(fields)
    .setTimestamp()
    .setFooter({ text: 'En attente de décision' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept.${session.memberId}.${session.recruitmentKey}`)
      .setLabel('✅ Accepter')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`refuse.${session.memberId}.${session.recruitmentKey}`)
      .setLabel('❌ Refuser')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ─── CONNEXION ─────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
