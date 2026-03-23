import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const RUNTIME_ENV_OUTPUT_PATH = path.resolve(
  os.tmpdir(),
  'runtime-config.env'
);
const PUBLIC_RUNTIME_ENV_KEYS = [
  'VITE_API_ROOT',
  'VITE_WEB_ROOT',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

function parseEnvFile(contents: string) {
  const env: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const normalizedLine = trimmedLine.startsWith('export ')
      ? trimmedLine.slice(7).trim()
      : trimmedLine;
    const separatorIndex = normalizedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const value = normalizedLine.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    env[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return env;
}

function readEnvFileIfExists(filePath: string) {
  try {
    return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

function buildBundledRuntimeEnvResource() {
  const publicEnv: Record<string, string> = {};
  const envFileNames = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.production.local',
  ];

  for (const fileName of envFileNames) {
    Object.assign(
      publicEnv,
      readEnvFileIfExists(path.resolve(process.cwd(), fileName))
    );
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!PUBLIC_RUNTIME_ENV_KEYS.includes(key) || typeof value !== 'string') {
      continue;
    }

    publicEnv[key] = value;
  }

  const serializedEntries = Object.entries(publicEnv)
    .filter(([key]) => PUBLIC_RUNTIME_ENV_KEYS.includes(key))
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (serializedEntries.length === 0) {
    return [];
  }

  fs.mkdirSync(path.dirname(RUNTIME_ENV_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    RUNTIME_ENV_OUTPUT_PATH,
    `${serializedEntries.map(([key, value]) => `${key}=${value}`).join('\n')}\n`,
    'utf8'
  );

  return [RUNTIME_ENV_OUTPUT_PATH];
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: buildBundledRuntimeEnvResource(),
    extendInfo: {
      NSMicrophoneUsageDescription:
        'Transcript Keeper needs microphone access to record your voice.',
      NSAudioCaptureUsageDescription:
        'Transcript Keeper needs system audio access to record audio playing on your Mac.',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
