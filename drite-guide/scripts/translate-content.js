#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TARGET_LANGUAGES = ['de', 'sq', 'fr', 'it', 'es'];
const LANGUAGE_NAMES = {
  de: 'German',
  sq: 'Albanian',
  fr: 'French',
  it: 'Italian',
  es: 'Spanish',
};

const TABLES = {
  categories: {
    sourceTable: 'categories',
    translationTable: 'category_translations',
    sourceSelect: 'id,name,subtitle,deleted_at',
    sourceOrder: 'name',
    foreignKey: 'category_id',
    conflictTarget: 'category_id,language_code',
    requiredFields: ['name'],
    fields: ['name', 'subtitle'],
  },
  cities: {
    sourceTable: 'cities',
    translationTable: 'city_translations',
    sourceSelect: 'id,city_name,description,deleted_at',
    sourceOrder: 'city_name',
    foreignKey: 'city_id',
    conflictTarget: 'city_id,language_code',
    requiredFields: ['city_name', 'description'],
    fields: ['city_name', 'description'],
  },
  places: {
    sourceTable: 'places',
    translationTable: 'place_translations',
    sourceSelect: 'id,name,description,address,opening_hours,deleted_at',
    sourceOrder: 'name',
    foreignKey: 'place_id',
    conflictTarget: 'place_id,language_code',
    requiredFields: ['name', 'description'],
    fields: ['name', 'description', 'address', 'opening_hours'],
    makeId: (item, languageCode) => `${item.id}-${languageCode}`,
  },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`
Usage:
  npm run translate:content -- [options]

Options:
  --dry-run                 Show what would be translated without writing to Supabase.
  --overwrite               Re-translate and overwrite existing translation fields.
  --tables=places,cities    Limit tables. Available: categories, cities, places.
  --languages=de,sq         Limit target languages. Available: de, sq, fr, it, es.
  --limit=5                 Translate at most this many row-language combinations.

Required local/server env vars:
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY

Optional env vars:
  SUPABASE_URL
  OPENAI_TRANSLATION_MODEL
`);
    process.exit(0);
  }

  const options = {
    tables: Object.keys(TABLES),
    languages: TARGET_LANGUAGES,
    overwrite: false,
    dryRun: false,
    limit: null,
  };

  for (const arg of argv) {
    if (arg === '--overwrite') {
      options.overwrite = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--tables=')) {
      options.tables = arg
        .slice('--tables='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--languages=')) {
      options.languages = arg
        .slice('--languages='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length));
      options.limit = Number.isFinite(value) && value > 0 ? value : null;
    }
  }

  for (const tableName of options.tables) {
    if (!TABLES[tableName]) {
      throw new Error(`Unknown table "${tableName}". Use: ${Object.keys(TABLES).join(', ')}`);
    }
  }

  for (const languageCode of options.languages) {
    if (!TARGET_LANGUAGES.includes(languageCode)) {
      throw new Error(`Unsupported language "${languageCode}". Use: ${TARGET_LANGUAGES.join(', ')}`);
    }
  }

  return options;
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function normalizeSourceFields(item, fields) {
  return Object.fromEntries(
    fields.map((field) => [field, typeof item[field] === 'string' ? item[field].trim() : ''])
  );
}

function makeExistingKey(parentId, languageCode) {
  return `${parentId}:${languageCode}`;
}

async function fetchRows(supabase, config) {
  const { data, error } = await supabase
    .from(config.sourceTable)
    .select(config.sourceSelect)
    .is('deleted_at', null)
    .order(config.sourceOrder, { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchExistingTranslations(supabase, config) {
  const { data, error } = await supabase
    .from(config.translationTable)
    .select([config.foreignKey, 'language_code', ...config.fields].join(','));

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map((row) => [
      makeExistingKey(row[config.foreignKey], row.language_code),
      row,
    ])
  );
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }

    throw new Error(`Translator returned invalid JSON: ${trimmed.slice(0, 160)}`);
  }
}

async function translateWithOpenAI({ model, apiKey, languageCode, fields }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are a professional travel app translator. Translate values from English, preserve place names, brand names, addresses, URLs, phone numbers, and opening-hour structure. Return only valid JSON with the same keys.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            target_language: LANGUAGE_NAMES[languageCode],
            target_language_code: languageCode,
            fields,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI translation failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const outputText =
    payload.output_text ||
    payload.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || '')
      .join('');

  const parsed = extractJsonObject(outputText);

  return Object.fromEntries(
    Object.entries(fields).map(([field, originalValue]) => [
      field,
      typeof parsed[field] === 'string' && parsed[field].trim()
        ? parsed[field].trim()
        : originalValue,
    ])
  );
}

function buildFieldsToTranslate({ config, sourceFields, existingTranslation, overwrite }) {
  const fields = {};

  for (const field of config.fields) {
    if (isBlank(sourceFields[field])) {
      continue;
    }

    if (overwrite || !existingTranslation || isBlank(existingTranslation[field])) {
      fields[field] = sourceFields[field];
    }
  }

  return fields;
}

function buildUpsertRow({ config, item, languageCode, translatedFields, existingTranslation }) {
  const row = {
    [config.foreignKey]: item.id,
    language_code: languageCode,
    updated_at: new Date().toISOString(),
  };

  if (config.makeId) {
    row.id = config.makeId(item, languageCode);
  }

  for (const field of config.fields) {
    if (Object.prototype.hasOwnProperty.call(translatedFields, field)) {
      row[field] = translatedFields[field];
    } else if (existingTranslation && !isBlank(existingTranslation[field])) {
      row[field] = existingTranslation[field];
    } else {
      row[field] = item[field] || '';
    }
  }

  return row;
}

async function upsertTranslation(supabase, config, row, dryRun) {
  if (dryRun) {
    return;
  }

  const { error } = await supabase
    .from(config.translationTable)
    .upsert(row, { onConflict: config.conflictTarget });

  if (error) {
    throw error;
  }
}

async function translateTable({ supabase, tableName, config, options, translator }) {
  const sourceRows = await fetchRows(supabase, config);
  const existingTranslations = await fetchExistingTranslations(supabase, config);
  let translatedCount = 0;
  let skippedCount = 0;

  console.log(`\n${tableName}: loaded ${sourceRows.length} rows`);

  for (const item of sourceRows) {
    if (options.limit && translatedCount >= options.limit) {
      break;
    }

    const sourceFields = normalizeSourceFields(item, config.fields);

    for (const languageCode of options.languages) {
      if (options.limit && translatedCount >= options.limit) {
        break;
      }

      const existingKey = makeExistingKey(item.id, languageCode);
      const existingTranslation = existingTranslations.get(existingKey);
      const fieldsToTranslate = buildFieldsToTranslate({
        config,
        sourceFields,
        existingTranslation,
        overwrite: options.overwrite,
      });

      if (Object.keys(fieldsToTranslate).length === 0) {
        skippedCount += 1;
        continue;
      }

      for (const requiredField of config.requiredFields) {
        if (isBlank(sourceFields[requiredField])) {
          throw new Error(
            `${tableName} row ${item.id} is missing required English field "${requiredField}"`
          );
        }
      }

      const translatedFields = await translator(languageCode, fieldsToTranslate);
      const row = buildUpsertRow({
        config,
        item,
        languageCode,
        translatedFields,
        existingTranslation,
      });

      await upsertTranslation(supabase, config, row, options.dryRun);
      translatedCount += 1;
      console.log(
        `${options.dryRun ? '[dry-run] ' : ''}${tableName}:${item.id} -> ${languageCode}`
      );
    }
  }

  console.log(`${tableName}: translated ${translatedCount}, skipped ${skippedCount}`);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.local'));

  const options = parseArgs(process.argv.slice(2));
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = requiredEnv('OPENAI_API_KEY');
  const openaiModel = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4.1-mini';

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const translator = (languageCode, fields) =>
    translateWithOpenAI({
      model: openaiModel,
      apiKey: openaiApiKey,
      languageCode,
      fields,
    });

  console.log(
    `Translating ${options.tables.join(', ')} to ${options.languages.join(', ')} using ${openaiModel}`
  );

  if (options.dryRun) {
    console.log('Dry run enabled: database writes are disabled.');
  }

  for (const tableName of options.tables) {
    await translateTable({
      supabase,
      tableName,
      config: TABLES[tableName],
      options,
      translator,
    });
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
