/**
 * Notification System for Build Pipeline
 * Supports Discord, Slack, and email notifications
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class NotificationService {
  constructor() {
    this.config = {
      discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        enabled: !!process.env.SLACK_WEBHOOK_URL,
      },
      teams: {
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        enabled: !!process.env.TEAMS_WEBHOOK_URL,
      },
    };
  }

  async notifyBuildSuccess(version, browsers, environment = 'production') {
    const message = {
      type: 'success',
      title: '✅ Extension Build Successful',
      description: `Assistente de Regulação Médica v${version} built successfully`,
      fields: [
        { name: 'Version', value: version, inline: true },
        { name: 'Environment', value: environment, inline: true },
        { name: 'Browsers', value: browsers.join(', '), inline: true },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false },
      ],
      color: 0x00ff00, // Green
      url: this.getBuildUrl(),
    };

    await this.sendNotifications(message);
  }

  async notifyBuildFailure(error, stage, version) {
    const message = {
      type: 'error',
      title: '❌ Extension Build Failed',
      description: `Build failed at stage: ${stage}`,
      fields: [
        { name: 'Stage', value: stage, inline: true },
        { name: 'Version', value: version || 'Unknown', inline: true },
        { name: 'Error', value: this.truncateText(error.message, 1000), inline: false },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false },
      ],
      color: 0xff0000, // Red
      url: this.getBuildUrl(),
    };

    await this.sendNotifications(message);
  }

  async notifyDeploymentSuccess(version, stores, environment) {
    const message = {
      type: 'success',
      title: '🚀 Extension Deployed Successfully',
      description: `Assistente de Regulação Médica v${version} deployed to stores`,
      fields: [
        { name: 'Version', value: version, inline: true },
        { name: 'Environment', value: environment, inline: true },
        { name: 'Stores', value: stores.join(', '), inline: true },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false },
      ],
      color: 0x0099ff, // Blue
      url: this.getDeployUrl(),
    };

    await this.sendNotifications(message);
  }

  async notifySecurityAlert(severity, issue, details) {
    const colors = {
      LOW: 0xffff00, // Yellow
      MEDIUM: 0xff9900, // Orange
      HIGH: 0xff0000, // Red
      CRITICAL: 0x800080, // Purple
    };

    const message = {
      type: 'warning',
      title: `🚨 Security Alert - ${severity}`,
      description: 'Security issue detected in medical extension',
      fields: [
        { name: 'Severity', value: severity, inline: true },
        { name: 'Issue', value: issue, inline: false },
        { name: 'Details', value: this.truncateText(details, 1000), inline: false },
        {
          name: 'Action Required',
          value: 'Review security report and address immediately',
          inline: false,
        },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false },
      ],
      color: colors[severity] || 0xff0000,
      url: this.getBuildUrl(),
    };

    await this.sendNotifications(message);
  }

  async notifyMedicalComplianceIssue(issue, details) {
    const message = {
      type: 'warning',
      title: '🏥 Medical Compliance Alert',
      description: 'GDPR/LGPD compliance issue detected',
      fields: [
        { name: 'Issue', value: issue, inline: false },
        { name: 'Details', value: this.truncateText(details, 1000), inline: false },
        { name: 'Compliance', value: 'GDPR/LGPD requirements must be addressed', inline: false },
        { name: 'Priority', value: 'HIGH - Medical data protection', inline: true },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false },
      ],
      color: 0xff4500, // Orange Red
      url: this.getBuildUrl(),
    };

    await this.sendNotifications(message);
  }

  async sendNotifications(message) {
    const promises = [];

    if (this.config.discord.enabled) {
      promises.push(this.sendDiscordNotification(message));
    }

    if (this.config.slack.enabled) {
      promises.push(this.sendSlackNotification(message));
    }

    if (this.config.teams.enabled) {
      promises.push(this.sendTeamsNotification(message));
    }

    if (promises.length === 0) {
      console.log('⚠️ No notification services configured');
      console.log('📝 Message would be:', JSON.stringify(message, null, 2));
      return;
    }

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const service = ['Discord', 'Slack', 'Teams'][index];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${service} notification sent`);
      } else {
        console.warn(`⚠️ ${service} notification failed:`, result.reason?.message);
      }
    });
  }

  async sendDiscordNotification(message) {
    if (!this.config.discord.enabled) return;

    const discordPayload = {
      embeds: [
        {
          title: message.title,
          description: message.description,
          color: message.color,
          fields: message.fields,
          footer: {
            text: 'Assistente de Regulação Médica CI/CD',
            icon_url:
              'https://raw.githubusercontent.com/ShadyBS/AssistenteDeRegulacaoMedica/main/icons/icon48.png',
          },
          timestamp: new Date().toISOString(),
          url: message.url,
        },
      ],
    };

    const response = await fetch(this.config.discord.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  async sendSlackNotification(message) {
    if (!this.config.slack.enabled) return;

    const slackPayload = {
      text: message.title,
      attachments: [
        {
          color: this.colorToSlack(message.color),
          title: message.title,
          text: message.description,
          fields: message.fields.map((field) => ({
            title: field.name,
            value: field.value,
            short: field.inline,
          })),
          footer: 'Assistente de Regulação Médica CI/CD',
          footer_icon:
            'https://raw.githubusercontent.com/ShadyBS/AssistenteDeRegulacaoMedica/main/icons/icon16.png',
          ts: Math.floor(Date.now() / 1000),
          title_link: message.url,
        },
      ],
    };

    const response = await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  async sendTeamsNotification(message) {
    if (!this.config.teams.enabled) return;

    const teamsPayload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: message.title,
      themeColor: this.colorToHex(message.color),
      sections: [
        {
          activityTitle: message.title,
          activitySubtitle: message.description,
          facts: message.fields.map((field) => ({
            name: field.name,
            value: field.value,
          })),
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Build',
          targets: [
            {
              os: 'default',
              uri: message.url || 'https://github.com/ShadyBS/AssistenteDeRegulacaoMedica',
            },
          ],
        },
      ],
    };

    const response = await fetch(this.config.teams.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamsPayload),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  colorToSlack(color) {
    const colors = {
      0x00ff00: 'good', // Green
      0xff0000: 'danger', // Red
      0xffff00: 'warning', // Yellow
      0x0099ff: '#0099ff', // Blue
    };
    return colors[color] || '#' + color.toString(16).padStart(6, '0');
  }

  colorToHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  getBuildUrl() {
    if (process.env.GITHUB_ACTIONS) {
      const repo = process.env.GITHUB_REPOSITORY;
      const runId = process.env.GITHUB_RUN_ID;
      return `https://github.com/${repo}/actions/runs/${runId}`;
    }
    return 'https://github.com/ShadyBS/AssistenteDeRegulacaoMedica';
  }

  getDeployUrl() {
    if (process.env.GITHUB_ACTIONS) {
      const repo = process.env.GITHUB_REPOSITORY;
      return `https://github.com/${repo}/releases`;
    }
    return 'https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/releases';
  }

  async saveNotificationLog(message) {
    const logDir = path.join(path.dirname(__dirname), '..', 'logs');
    await fs.ensureDir(logDir);

    const logFile = path.join(logDir, 'notifications.json');
    let logs = [];

    if (await fs.pathExists(logFile)) {
      logs = await fs.readJson(logFile);
    }

    logs.push({
      ...message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });

    // Keep only last 100 notifications
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    await fs.writeJson(logFile, logs, { spaces: 2 });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const [action, ...params] = args;

  const notifier = new NotificationService();

  switch (action) {
    case 'success':
      await notifier.notifyBuildSuccess(
        params[0] || '1.0.0',
        (params[1] || 'chrome,firefox,edge').split(','),
        params[2] || 'production'
      );
      break;

    case 'failure':
      await notifier.notifyBuildFailure(
        new Error(params[0] || 'Build failed'),
        params[1] || 'build',
        params[2] || '1.0.0'
      );
      break;

    case 'deployment':
      await notifier.notifyDeploymentSuccess(
        params[0] || '1.0.0',
        (params[1] || 'chrome,firefox,edge').split(','),
        params[2] || 'production'
      );
      break;

    case 'security':
      await notifier.notifySecurityAlert(
        params[0] || 'HIGH',
        params[1] || 'Security issue detected',
        params[2] || 'Review security scan results'
      );
      break;

    case 'compliance':
      await notifier.notifyMedicalComplianceIssue(
        params[0] || 'GDPR compliance issue',
        params[1] || 'Medical data handling needs review'
      );
      break;

    case 'test':
      console.log('🧪 Testing notification services...');
      await notifier.notifyBuildSuccess('1.0.0-test', ['chrome'], 'test');
      break;

    default:
      console.log('Usage: node notification.js <action> [params...]');
      console.log('Actions:');
      console.log('  success <version> <browsers> <environment>');
      console.log('  failure <error> <stage> <version>');
      console.log('  deployment <version> <stores> <environment>');
      console.log('  security <severity> <issue> <details>');
      console.log('  compliance <issue> <details>');
      console.log('  test');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Notification script failed:', error);
    process.exit(1);
  });
}

export { NotificationService };
