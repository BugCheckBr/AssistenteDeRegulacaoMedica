/**
 * Version Bump Utility
 * Manages semantic versioning for browser extension
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class VersionManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..', '..');
    this.manifestPath = path.join(this.rootDir, 'manifest.json');
    this.packagePath = path.join(this.rootDir, 'package.json');
    this.chromeManifestPath = path.join(this.rootDir, 'manifest.json');
    this.edgeManifestPath = path.join(this.rootDir, 'manifest-edge.json');
    this.firefoxManifestPath = path.join(this.rootDir, 'manifest-firefox.json');
  }

  async bumpVersion(type = 'patch') {
    console.log(`🔢 Bumping version (${type})...`);

    try {
      // Read current versions
      const currentVersion = await this.getCurrentVersion();
      console.log(`📦 Current version: ${currentVersion}`);

      // Calculate new version
      const newVersion = this.calculateNewVersion(currentVersion, type);
      console.log(`📦 New version: ${newVersion}`);

      // Update all files
      await this.updateManifest(newVersion);
      await this.updatePackageJson(newVersion);

      // Generate changelog entry
      await this.generateChangelogEntry(currentVersion, newVersion, type);

      console.log(`✅ Version bumped to ${newVersion}`);
      return newVersion;
    } catch (error) {
      console.error('❌ Version bump failed:', error);
      process.exit(1);
    }
  }

  async getCurrentVersion() {
    if (await fs.pathExists(this.manifestPath)) {
      const manifest = await fs.readJson(this.manifestPath);
      return manifest.version;
    }

    if (await fs.pathExists(this.packagePath)) {
      const packageJson = await fs.readJson(this.packagePath);
      return packageJson.version;
    }

    throw new Error('No version file found');
  }

  calculateNewVersion(currentVersion, type) {
    const parts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = parts;

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`Invalid version type: ${type}`);
    }
  }

  async updateManifest(newVersion) {
    // Update Chrome manifest
    if (await fs.pathExists(this.chromeManifestPath)) {
      const manifest = await fs.readJson(this.chromeManifestPath);
      manifest.version = newVersion;
      await fs.writeJson(this.chromeManifestPath, manifest, { spaces: 2 });
      console.log(`✅ Updated manifest.json to ${newVersion}`);
    }

    // Update Edge manifest
    if (await fs.pathExists(this.edgeManifestPath)) {
      const edgeManifest = await fs.readJson(this.edgeManifestPath);
      edgeManifest.version = newVersion;
      await fs.writeJson(this.edgeManifestPath, edgeManifest, { spaces: 2 });
      console.log(`✅ Updated manifest-edge.json to ${newVersion}`);
    }

    // Update Firefox manifest
    if (await fs.pathExists(this.firefoxManifestPath)) {
      const firefoxManifest = await fs.readJson(this.firefoxManifestPath);
      firefoxManifest.version = newVersion;
      await fs.writeJson(this.firefoxManifestPath, firefoxManifest, { spaces: 2 });
      console.log(`✅ Updated manifest-firefox.json to ${newVersion}`);
    }
  }

  async updatePackageJson(newVersion) {
    if (await fs.pathExists(this.packagePath)) {
      const packageJson = await fs.readJson(this.packagePath);
      packageJson.version = newVersion;
      await fs.writeJson(this.packagePath, packageJson, { spaces: 2 });
      console.log(`✅ Updated package.json to ${newVersion}`);
    }
  }

  async generateChangelogEntry(oldVersion, newVersion, type) {
    const changelogPath = path.join(this.rootDir, 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];

    let changelog = '';
    if (await fs.pathExists(changelogPath)) {
      changelog = await fs.readFile(changelogPath, 'utf8');
    } else {
      changelog =
        '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }

    const newEntry = `## [${newVersion}] - ${date}\n\n### ${this.getChangeTypeTitle(
      type
    )}\n\n- Version bump to ${newVersion}\n\n`;

    // Insert new entry after the header
    const lines = changelog.split('\n');
    const headerEnd = lines.findIndex((line) => line.startsWith('## [')) || 3;

    lines.splice(headerEnd, 0, ...newEntry.split('\n'));

    await fs.writeFile(changelogPath, lines.join('\n'));
    console.log('✅ Updated CHANGELOG.md');
  }

  getChangeTypeTitle(type) {
    switch (type) {
      case 'major':
        return 'Breaking Changes';
      case 'minor':
        return 'Added';
      case 'patch':
        return 'Fixed';
      default:
        return 'Changed';
    }
  }

  async validateVersion(version) {
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(version)) {
      throw new Error('Version must follow semantic versioning (x.y.z)');
    }

    // Check if version already exists in git tags
    try {
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      const exec = promisify(spawn);

      const result = await exec('git', ['tag', '-l', `v${version}`], {
        cwd: this.rootDir,
        encoding: 'utf8',
      });

      if (result.stdout.trim()) {
        throw new Error(`Version ${version} already exists as git tag`);
      }
    } catch {
      // Git not available or no tags - continue
      console.log('⚠️ Could not check git tags');
    }

    return true;
  }

  async getVersionInfo() {
    const currentVersion = await this.getCurrentVersion();
    const parts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = parts;

    return {
      current: currentVersion,
      major,
      minor,
      patch,
      next: {
        major: `${major + 1}.0.0`,
        minor: `${major}.${minor + 1}.0`,
        patch: `${major}.${minor}.${patch + 1}`,
      },
    };
  }

  async createGitTag(version) {
    try {
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      const exec = promisify(spawn);

      // Create tag
      await exec('git', ['tag', '-a', `v${version}`, '-m', `Release v${version}`], {
        cwd: this.rootDir,
      });

      console.log(`✅ Created git tag v${version}`);

      // Push tag
      await exec('git', ['push', 'origin', `v${version}`], {
        cwd: this.rootDir,
      });

      console.log('✅ Pushed tag to origin');
    } catch (error) {
      console.warn(`⚠️ Could not create git tag: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'patch';

  const manager = new VersionManager();

  if (action === 'info') {
    const info = await manager.getVersionInfo();
    console.log('📊 Version Information:');
    console.log(`Current: ${info.current}`);
    console.log(`Next patch: ${info.next.patch}`);
    console.log(`Next minor: ${info.next.minor}`);
    console.log(`Next major: ${info.next.major}`);
    return;
  }

  if (!['patch', 'minor', 'major'].includes(action)) {
    console.error('❌ Invalid version type. Use: patch, minor, major, or info');
    process.exit(1);
  }

  const newVersion = await manager.bumpVersion(action);

  // Create git tag if in CI or if requested
  if (process.env.CI || args.includes('--tag')) {
    await manager.createGitTag(newVersion);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Version bump script failed:', error);
    process.exit(1);
  });
}

export { VersionManager };
