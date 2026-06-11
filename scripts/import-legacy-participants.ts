import "dotenv/config";

import { createReadStream, createWriteStream, existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import yauzl from "yauzl";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildProtocol, slugify } from "../src/shared/utils";

type Command = "analyze" | "import" | "photo-manifest" | "photos" | "build-json" | "sync-data" | "upload-images";
type SqlValue = string | number | null;
type RegistrationStatusValue =
  | "PENDING_PAYMENT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SEMIFINALIST"
  | "WINNER";
type PaymentMethodValue = "PIX" | "BOLETO" | "CREDIT_CARD";
type PaymentStatusValue = "PENDING" | "CONFIRMED" | "RECEIVED";

type LegacyCategory = {
  id: number;
  slug: string;
  order: number;
  title: string;
  subtitle: string | null;
};

type LegacyConcourse = {
  id: number;
  year: number;
  title: string;
  amountCents: number;
  status: number;
  frame: string | null;
  createdAt: Date | null;
  revealAt: Date | null;
};

type LegacyCustomer = {
  id: number;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

type LegacyChild = {
  id: number;
  customerId: number | null;
  likes: number;
  registeredAt: Date | null;
  statusSite: number;
  birthDate: Date | null;
  gender: "MALE" | "FEMALE" | null;
  name: string | null;
  picture1: string | null;
  officialPicture: string | null;
  picture2: string | null;
  url: string | null;
  pictureWithFrame: string | null;
};

type LegacyInvoice = {
  id: number;
  concourseId: number | null;
  categoryId: number | null;
  customerId: number | null;
  childId: number | null;
  type: string | null;
  status: string | null;
  createdAt: Date | null;
  amountCents: number;
  dueDate: Date | null;
  paidAt: Date | null;
  returnText: string | null;
  returnAmountCents: number | null;
  billetUrl: string | null;
  installmentBilletUrl: string | null;
  pixPayload: string | null;
};

type LegacyFinalist = {
  concourseId: number | null;
  categoryId: number | null;
  childId: number | null;
  winner: number;
};

type LegacyCustomerStep = {
  id: number;
  createdAt: Date | null;
  userId: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  step: string | null;
};

type LegacyData = {
  categories: Map<number, LegacyCategory>;
  concourses: Map<number, LegacyConcourse>;
  customers: Map<number, LegacyCustomer>;
  children: Map<number, LegacyChild>;
  invoices: LegacyInvoice[];
  finalists: LegacyFinalist[];
  customerSteps: LegacyCustomerStep[];
};

type SkippedRecord = {
  scope: string;
  legacyId: string;
  reason: string;
};

type PhotoManifestEntry = {
  registrationId: string;
  legacyChildId: number;
  legacyInvoiceId: number | null;
  year: number;
  kind: "picture1" | "official" | "picture2" | "framed" | "frame";
  sourcePath: string;
  sourceUrl: string;
  targetStorageKey: string;
  order: number;
  isCover: boolean;
};

type PhotoSourceEntry = {
  legacyInvoiceId: number;
  legacyChildId: number;
  year: number;
  picture1: string | null;
  officialPicture: string | null;
  picture2: string | null;
  pictureWithFrame: string | null;
};

type IdMap = {
  contests: Record<string, string>;
  categories: Record<string, string>;
  customers: Record<string, string>;
  children: Record<string, string>;
  registrations: Record<string, string>;
  invoices: Record<string, string>;
  payments: Record<string, string>;
};

type NormalizedLegacyImport = {
  meta: {
    sourceFile: string;
    generatedAt: string;
  };
  contests: Array<{
    legacyId: number;
    year: number;
    name: string;
    status: string;
    registrationFeeCents: number;
    frameImageKey: string | null;
    revealAt: string | null;
    createdAt: string | null;
  }>;
  categories: Array<{
    legacyContestId: number;
    legacyCategoryId: number;
    name: string;
    slug: string;
    minAgeMonths: number;
    maxAgeMonths: number;
    order: number;
  }>;
  guardians: Array<{
    legacyCustomerId: number;
    name: string;
    email: string;
    cpf: string | null;
    phone: string | null;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  }>;
  participants: Array<{
    legacyChildId: number;
    legacyCustomerId: number;
    name: string;
    slug: string;
    birthDate: string;
    gender: "MALE" | "FEMALE" | null;
    city: string;
    state: string;
    imageConsentAt: string;
    createdAt: string | null;
    likes: number;
  }>;
  registrations: Array<{
    legacyChildId: number;
    legacyCustomerId: number;
    legacyContestId: number;
    legacyCategoryId: number;
    legacyInvoiceId: number;
    legacyInvoiceIds: number[];
    year: number;
    protocol: string;
    status: RegistrationStatusValue;
    likesCount: number;
    approvedAt: string | null;
    createdAt: string | null;
  }>;
  payments: Array<{
    legacyInvoiceId: number;
    registrationProtocol: string;
    method: PaymentMethodValue;
    status: PaymentStatusValue;
    amountCents: number;
    dueDate: string | null;
    paidAt: string | null;
    invoiceUrl: string | null;
    pixPayload: string | null;
    boletoUrl: string | null;
    createdAt: string | null;
  }>;
  indexes: {
    registrationsByChildId: Record<string, string[]>;
  };
  skipped: SkippedRecord[];
};

type SyncResult = {
  contests: Record<string, string>;
  categories: Record<string, string>;
  guardians: Record<string, string>;
  children: Record<string, string>;
  registrationsByChildId: Record<string, Array<{ id: string; protocol: string; year: number; status: string; createdAt: string | null }>>;
  registrationsByLegacyInvoiceId: Record<string, string>;
  payments: Record<string, string>;
};

const RELEVANT_TABLES = new Set([
  "cc_categories",
  "cc_concourses",
  "cc_customers",
  "cc_childs",
  "cc_invoices",
  "cc_finalists",
  "cc_customers_steps",
]);

const CATEGORY_RANGES: Record<number, { minAgeMonths: number; maxAgeMonths: number }> = {
  1: { minAgeMonths: 0, maxAgeMonths: 10 },
  2: { minAgeMonths: 11, maxAgeMonths: 23 },
  3: { minAgeMonths: 24, maxAgeMonths: 71 },
  4: { minAgeMonths: 72, maxAgeMonths: 119 },
  5: { minAgeMonths: 120, maxAgeMonths: 179 },
};

const DEFAULT_SQL_FILE = path.join(process.cwd(), "data/legacy/criancam_site.sql");
const REPORT_DIR = "docs/legacy-import";
const LEGACY_DATA_DIR = path.join(process.cwd(), "data/legacy");
const LEGACY_IMPORT_JSON_FILE = path.join(LEGACY_DATA_DIR, "import-data.json");
const LEGACY_IMPORT_RESULT_FILE = path.join(LEGACY_DATA_DIR, "import-result.json");
const LEGACY_IMAGE_UPLOAD_REPORT_FILE = path.join(LEGACY_DATA_DIR, "image-upload-report.json");
const LEGACY_PARTICIPANTS_ZIP_KEY = "participants.zip";
const LEGACY_PARTICIPANTS_ZIP_ROOT = "participants";
const PHOTO_MANIFEST_FILE = path.join(REPORT_DIR, "photos-manifest.json");
const PHOTO_SOURCES_FILE = path.join(REPORT_DIR, "photo-sources.json");
const PHOTO_MANIFEST_FULL_FILE = path.join(REPORT_DIR, "photos-manifest-full.json");
const DEFAULT_PHOTO_BASE_URL = "https://criancamaisfotogenica.com.br/site/views/_data/concourses/";
const FAKE_EMAIL_PATTERN = /^email\d+@cmf\.com\.br$/i;
const PAID_STATUSES = new Set(["pago", "baixa manual"]);

const options = parseArgs(process.argv.slice(2));
const command = parseCommand(options.command);
const sqlFile = options.sql ?? process.env.LEGACY_SQL_FILE ?? DEFAULT_SQL_FILE;
const reportDir = options.reportDir ?? process.env.LEGACY_REPORT_DIR ?? REPORT_DIR;
const limit = options.limit ? Number.parseInt(options.limit, 10) : null;
const offset = options.offset ? Number.parseInt(options.offset, 10) : 0;
const photoBaseUrl = normalizeBaseUrl(
  options.photoBaseUrl ?? process.env.LEGACY_PHOTO_BASE_URL ?? DEFAULT_PHOTO_BASE_URL,
);
const createPhotoRows = readBoolean(options.createPhotoRows ?? process.env.LEGACY_CREATE_PHOTO_ROWS);

let prisma: PrismaClient | null = null;

async function main() {
  if (command === "photos") {
    await importPhotos();
    return;
  }

  if (command === "sync-data") {
    await syncLegacyImportJson();
    return;
  }

  if (command === "upload-images") {
    await uploadLegacyImagesFromFolder();
    return;
  }

  const data = await parseLegacyDump(sqlFile);
  const analysis = analyzeLegacyData(data);

  if (command === "build-json") {
    await buildLegacyImportJson(data, analysis.skipped);
    return;
  }

  if (command === "analyze") {
    await writeReports(reportDir, {
      analysis,
      skipped: analysis.skipped,
      idMap: emptyIdMap(),
      photoManifest: buildAnalysisPhotoManifest(data),
    });
    printAnalysis(analysis);
    return;
  }

  if (command === "photo-manifest") {
    await generateFullPhotoManifest(data);
    return;
  }

  const result = await importLegacyData(data);
  await writeReports(reportDir, {
    analysis,
    skipped: mergeSkipped(analysis.skipped, result.skipped),
    idMap: result.idMap,
    photoManifest: result.photoManifest,
  });

  console.log(
    `Importação concluída: ${result.created.users} responsáveis, ` +
      `${result.created.participants} participantes, ${result.created.registrations} inscrições, ` +
      `${result.created.payments} pagamentos.`,
  );
  console.log(`Relatórios gravados em ${reportDir}.`);
}

function parseArgs(argv: string[]) {
  const parsed: Record<string, string | undefined> = {};
  const [maybeCommand, ...rest] = argv;
  if (maybeCommand && !maybeCommand.startsWith("--")) {
    parsed.command = maybeCommand;
  } else if (maybeCommand) {
    rest.unshift(maybeCommand);
  }

  for (const arg of rest) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=", 2);
    parsed[key] = value ?? "true";
  }

  return parsed;
}

function parseCommand(input: string | undefined): Command {
  if (!input) return "analyze";
  if (
    input === "analyze" ||
    input === "import" ||
    input === "photo-manifest" ||
    input === "photos" ||
    input === "build-json" ||
    input === "sync-data" ||
    input === "upload-images"
  ) {
    return input;
  }
  throw new Error(
    `Comando inválido "${input}". Use analyze, import, photo-manifest, photos, build-json, sync-data ou upload-images.`,
  );
}

function readBoolean(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

async function parseLegacyDump(filePath: string): Promise<LegacyData> {
  const data: LegacyData = {
    categories: new Map(),
    concourses: new Map(),
    customers: new Map(),
    children: new Map(),
    invoices: [],
    finalists: [],
    customerSteps: [],
  };

  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lines = readline.createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY });

  let currentTable: string | null = null;
  let statement = "";

  for await (const line of lines) {
    if (!currentTable) {
      const match = line.match(/^INSERT INTO `([^`]+)`/);
      if (!match || !RELEVANT_TABLES.has(match[1])) continue;
      currentTable = match[1];
      statement = line;
    } else {
      statement += `\n${line}`;
    }

    if (line.trimEnd().endsWith(";")) {
      processInsertStatement(currentTable, statement, data);
      currentTable = null;
      statement = "";
    }
  }

  return data;
}

function processInsertStatement(table: string, statement: string, data: LegacyData) {
  const parsed = parseInsert(statement);
  for (const row of parsed.rows) {
    const object = toRowObject(parsed.columns, row);
    switch (table) {
      case "cc_categories": {
        const category = mapCategory(object);
        data.categories.set(category.id, category);
        break;
      }
      case "cc_concourses": {
        const concourse = mapConcourse(object);
        data.concourses.set(concourse.id, concourse);
        break;
      }
      case "cc_customers": {
        const customer = mapCustomer(object);
        data.customers.set(customer.id, customer);
        break;
      }
      case "cc_childs": {
        const child = mapChild(object);
        data.children.set(child.id, child);
        break;
      }
      case "cc_invoices":
        data.invoices.push(mapInvoice(object));
        break;
      case "cc_finalists":
        data.finalists.push(mapFinalist(object));
        break;
      case "cc_customers_steps":
        data.customerSteps.push(mapCustomerStep(object));
        break;
    }
  }
}

function parseInsert(statement: string): { columns: string[]; rows: SqlValue[][] } {
  const match = statement.match(/^INSERT INTO `[^`]+` \(([\s\S]*?)\) VALUES\s*([\s\S]*);?\s*$/);
  if (!match) throw new Error("INSERT legado em formato inesperado.");

  const columns = Array.from(match[1].matchAll(/`([^`]+)`/g), (column) => column[1]);
  const rows = parseValues(match[2].replace(/;\s*$/, ""));
  return { columns, rows };
}

function parseValues(values: string): SqlValue[][] {
  const rows: SqlValue[][] = [];
  let row: SqlValue[] | null = null;
  let token = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < values.length; index += 1) {
    const char = values[index];

    if (inString) {
      token += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "'") {
        inString = false;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      token += char;
      continue;
    }

    if (char === "(" && !row) {
      row = [];
      token = "";
      continue;
    }

    if (!row) continue;

    if (char === ",") {
      row.push(parseSqlValue(token));
      token = "";
      continue;
    }

    if (char === ")") {
      row.push(parseSqlValue(token));
      rows.push(row);
      row = null;
      token = "";
      continue;
    }

    token += char;
  }

  return rows;
}

function parseSqlValue(raw: string): SqlValue {
  const value = raw.trim();
  if (!value || value.toUpperCase() === "NULL") return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return unescapeSqlString(value.slice(1, -1));
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function unescapeSqlString(value: string): string {
  return value
    .replace(/\\0/g, "\0")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\Z/g, "\u001a")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function toRowObject(columns: string[], row: SqlValue[]): Record<string, SqlValue> {
  const object: Record<string, SqlValue> = {};
  columns.forEach((column, index) => {
    object[column] = row[index] ?? null;
  });
  return object;
}

function mapCategory(row: Record<string, SqlValue>): LegacyCategory {
  return {
    id: requiredInt(row.id_category, "cc_categories.id_category"),
    slug: requiredString(row.url, "cc_categories.url"),
    order: asInt(row.orderby) ?? 0,
    title: requiredString(row.title, "cc_categories.title"),
    subtitle: asString(row.subtitle),
  };
}

function mapConcourse(row: Record<string, SqlValue>): LegacyConcourse {
  const title = asString(row.title) ?? asString(row.url) ?? String(row.id_concourse);
  return {
    id: requiredInt(row.id_concourse, "cc_concourses.id_concourse"),
    year: Number.parseInt(title, 10),
    title,
    amountCents: asInt(row.amount) ?? 0,
    status: asInt(row.status) ?? 0,
    frame: asString(row.frame),
    createdAt: parseLegacyDate(row.date_create),
    revealAt: parseLegacyDate(row.date_winners),
  };
}

function mapCustomer(row: Record<string, SqlValue>): LegacyCustomer {
  return {
    id: requiredInt(row.id_customer, "cc_customers.id_customer"),
    name: asString(row.name),
    cpf: normalizeDigits(asString(row.cpf)),
    phone: normalizePhone(asString(row.phonenumber)),
    email: normalizeEmail(asString(row.email)),
    zipCode: normalizeDigits(asString(row.zipcode)),
    street: cleanString(row.address),
    number: cleanString(row.number),
    complement: cleanString(row.complement),
    neighborhood: cleanString(row.neighborhood),
    city: cleanString(row.city),
    state: normalizeState(asString(row.state)),
  };
}

function mapChild(row: Record<string, SqlValue>): LegacyChild {
  return {
    id: requiredInt(row.id_child, "cc_childs.id_child"),
    customerId: asInt(row.id_customer),
    likes: asInt(row.likes) ?? 0,
    registeredAt: parseLegacyDate(row.date_register),
    statusSite: asInt(row.status_site) ?? 0,
    birthDate: parseLegacyDate(row.date_birth),
    gender: parseGender(asString(row.gender)),
    name: cleanString(row.name),
    picture1: cleanPath(row.picture1),
    officialPicture: cleanPath(row.official_picture),
    picture2: cleanPath(row.picture2),
    url: cleanString(row.url),
    pictureWithFrame: cleanPath(row.picture_with_frame),
  };
}

function mapInvoice(row: Record<string, SqlValue>): LegacyInvoice {
  return {
    id: requiredInt(row.id_invoice, "cc_invoices.id_invoice"),
    concourseId: asInt(row.id_concourse),
    categoryId: asInt(row.id_category),
    customerId: asInt(row.id_customer),
    childId: asInt(row.id_child),
    type: asString(row.type),
    status: asString(row.status),
    createdAt: parseLegacyDate(row.date_create),
    amountCents: asInt(row.amount) ?? 0,
    dueDate: parseLegacyDate(row.due_date),
    paidAt: parseLegacyDate(row.return_date_payment) ?? parseLegacyDate(row.return_date),
    returnText: asString(row.return_text),
    returnAmountCents: asInt(row.return_amount),
    billetUrl: asString(row.bf_url_slip),
    installmentBilletUrl: asString(row.bf_url_slip_installment),
    pixPayload: asString(row.ctp_pix_code),
  };
}

function mapFinalist(row: Record<string, SqlValue>): LegacyFinalist {
  return {
    concourseId: asInt(row.id_concourse),
    categoryId: asInt(row.id_category),
    childId: asInt(row.id_child),
    winner: asInt(row.winner) ?? 0,
  };
}

function mapCustomerStep(row: Record<string, SqlValue>): LegacyCustomerStep {
  return {
    id: requiredInt(row.id_step, "cc_customers_steps.id_step"),
    createdAt: parseLegacyDate(row.date),
    userId: asInt(row.id_user),
    name: cleanString(row.name),
    email: normalizeEmail(asString(row.email)),
    phone: normalizePhone(asString(row.phonenumber)),
    step: cleanString(row.step),
  };
}

function analyzeLegacyData(data: LegacyData) {
  const skipped: SkippedRecord[] = [];
  const invoiceGroups = groupInvoices(data.invoices);
  const byYear: Record<string, { invoices: number; paid: number; pending: number; finalists: number; winners: number }> = {};

  for (const group of invoiceGroups.values()) {
    const invoice = selectBestInvoice(group);
    const year = invoice.concourseId ? data.concourses.get(invoice.concourseId)?.year : null;
    const yearKey = year ? String(year) : "sem-ano";
    byYear[yearKey] ??= { invoices: 0, paid: 0, pending: 0, finalists: 0, winners: 0 };
    byYear[yearKey].invoices += group.length;
    byYear[yearKey].paid += group.filter(isPaidInvoice).length;
    byYear[yearKey].pending += group.filter((item) => !isPaidInvoice(item)).length;

    const finalist = findFinalist(data, invoice);
    if (finalist) byYear[yearKey].finalists += 1;
    if (finalist?.winner === 1) byYear[yearKey].winners += 1;

    validateInvoiceGroup(data, group, skipped);
  }

  const fakeOrInvalidEmails = Array.from(data.customers.values()).filter((customer) =>
    shouldGenerateTechnicalEmail(customer.email),
  ).length;

  return {
    sourceFile: sqlFile,
    tables: {
      categories: data.categories.size,
      concourses: data.concourses.size,
      customers: data.customers.size,
      children: data.children.size,
      invoices: data.invoices.length,
      invoiceGroups: invoiceGroups.size,
      finalists: data.finalists.length,
      customerSteps: data.customerSteps.length,
    },
    byYear,
    warnings: {
      fakeOrInvalidEmails,
      childrenWithoutBirthDate: Array.from(data.children.values()).filter((child) => !child.birthDate).length,
      invoicesWithoutChild: data.invoices.filter((invoice) => !invoice.childId).length,
      invoicesWithoutCustomer: data.invoices.filter((invoice) => !invoice.customerId).length,
    },
    skipped,
  };
}

function validateInvoiceGroup(data: LegacyData, group: LegacyInvoice[], skipped: SkippedRecord[]) {
  const invoice = selectBestInvoice(group);
  const legacyId = group.map((item) => item.id).join(",");

  if (!invoice.concourseId || !data.concourses.has(invoice.concourseId)) {
    skipped.push({ scope: "registration", legacyId, reason: "Concurso legado ausente." });
  }
  if (!invoice.categoryId || !data.categories.has(invoice.categoryId)) {
    skipped.push({ scope: "registration", legacyId, reason: "Categoria legado ausente." });
  }
  if (!invoice.customerId || !data.customers.has(invoice.customerId)) {
    skipped.push({ scope: "registration", legacyId, reason: "Responsável legado ausente." });
  }
  const child = invoice.childId ? data.children.get(invoice.childId) : null;
  if (!child) {
    skipped.push({ scope: "registration", legacyId, reason: "Criança legado ausente." });
  } else if (!child.birthDate) {
    skipped.push({ scope: "registration", legacyId, reason: "Criança sem data de nascimento." });
  }
}

async function importLegacyData(data: LegacyData) {
  const idMap = emptyIdMap();
  const skipped: SkippedRecord[] = [];
  const photoManifest: PhotoManifestEntry[] = [];
  const created = { users: 0, participants: 0, registrations: 0, payments: 0 };
  const passwordHash = await bcrypt.hash(`legacy-import-${randomUUID()}`, 10);

  const contestMap = await importContestsAndCategories(data, idMap, photoManifest);
  const invoiceGroups = Array.from(groupInvoices(data.invoices).values());
  const selectedGroups = invoiceGroups.slice(offset, limit ? offset + limit : undefined);
  const selectedCustomerIds = new Set(
    selectedGroups.map((group) => selectBestInvoice(group).customerId).filter(isPresent),
  );
  const guardianMap = await importGuardians(data, idMap, passwordHash, created, selectedCustomerIds);

  let processedGroups = 0;
  for (const group of selectedGroups) {
    processedGroups += 1;
    if (processedGroups === 1 || processedGroups % 50 === 0 || processedGroups === selectedGroups.length) {
      console.log(
        `Importando inscrições ${offset + processedGroups}/${invoiceGroups.length} ` +
          `(lote ${processedGroups}/${selectedGroups.length})`,
      );
    }

    const invoice = selectBestInvoice(group);
    const child = invoice.childId ? data.children.get(invoice.childId) : null;
    const customer = invoice.customerId ? data.customers.get(invoice.customerId) : null;
    const contest = invoice.concourseId ? contestMap.get(invoice.concourseId) : null;
    const categoryId = contest && invoice.categoryId ? contest.categoryIds.get(invoice.categoryId) : null;
    const guardianId = invoice.customerId ? guardianMap.get(invoice.customerId) : null;

    if (!child || !customer || !contest || !categoryId || !guardianId || !child.birthDate) {
      validateInvoiceGroup(data, group, skipped);
      continue;
    }

    const participant = await ensureParticipant({
      child,
      customer,
      guardianId,
      idMap,
      created,
    });

    const registration = await ensureRegistration({
      group,
      invoice,
      child,
      contestId: contest.id,
      contestYear: contest.year,
      categoryId,
      participantId: participant.id,
      status: resolveRegistrationStatus(data, invoice, child),
      idMap,
      created,
    });

    for (const paymentInvoice of group) {
      const paymentId = await ensurePayment(registration.id, paymentInvoice);
      if (paymentId) {
        idMap.invoices[String(paymentInvoice.id)] = registration.id;
        idMap.payments[String(paymentInvoice.id)] = paymentId;
        created.payments += 1;
      }
    }

    photoManifest.push(...buildRegistrationPhotoManifest(registration.id, contest.year, invoice, child));

    if (createPhotoRows) {
      await ensurePhotoRows(registration.id, photoManifest.filter((entry) => entry.registrationId === registration.id));
    }
  }

  return { created, skipped, idMap, photoManifest };
}

async function buildLegacyImportJson(data: LegacyData, analysisSkipped: SkippedRecord[]) {
  const normalized = normalizeLegacyImport(data, analysisSkipped);
  await writeJson(LEGACY_IMPORT_JSON_FILE, normalized);
  console.log(
    [
      `JSON legado gerado em ${LEGACY_IMPORT_JSON_FILE}`,
      `Concursos: ${normalized.contests.length}`,
      `Categorias: ${normalized.categories.length}`,
      `Responsáveis: ${normalized.guardians.length}`,
      `Participantes: ${normalized.participants.length}`,
      `Inscrições: ${normalized.registrations.length}`,
      `Pagamentos: ${normalized.payments.length}`,
      `Exceções: ${normalized.skipped.length}`,
    ].join("\n"),
  );
}

function normalizeLegacyImport(data: LegacyData, analysisSkipped: SkippedRecord[]): NormalizedLegacyImport {
  const finalistConcourseIds = new Set(data.finalists.map((finalist) => finalist.concourseId).filter(isPresent));
  const emailByCustomer = buildCustomerEmailMap(data.customers);
  const skipped = mergeSkipped(analysisSkipped);

  const contests = Array.from(data.concourses.values())
    .filter((concourse) => Number.isInteger(concourse.year))
    .sort((left, right) => left.year - right.year)
    .map((concourse) => ({
      legacyId: concourse.id,
      year: concourse.year,
      name: `Criança Mais Fotogênica do Brasil ${concourse.year}`,
      status: resolveContestStatus(concourse, finalistConcourseIds),
      registrationFeeCents: concourse.amountCents,
      frameImageKey: concourse.frame ? buildFrameStorageKey(concourse.year, concourse.frame) : null,
      revealAt: toIso(concourse.revealAt),
      createdAt: toIso(concourse.createdAt),
    }));

  const categories = contests.flatMap((contest) =>
    Array.from(data.categories.values()).flatMap((category) => {
      const range = CATEGORY_RANGES[category.id];
      if (!range) return [];
      return [{
        legacyContestId: contest.legacyId,
        legacyCategoryId: category.id,
        name: category.title,
        slug: category.slug,
        minAgeMonths: range.minAgeMonths,
        maxAgeMonths: range.maxAgeMonths,
        order: category.order,
      }];
    }),
  );

  const guardiansById = new Map<number, NormalizedLegacyImport["guardians"][number]>();
  const participantsById = new Map<number, NormalizedLegacyImport["participants"][number]>();
  const registrations: NormalizedLegacyImport["registrations"] = [];
  const payments: NormalizedLegacyImport["payments"] = [];
  const registrationsByChildId: Record<string, string[]> = {};

  for (const group of groupInvoices(data.invoices).values()) {
    const invoice = selectBestInvoice(group);
    const child = invoice.childId ? data.children.get(invoice.childId) : null;
    const customer = invoice.customerId ? data.customers.get(invoice.customerId) : null;
    const concourse = invoice.concourseId ? data.concourses.get(invoice.concourseId) : null;
    const category = invoice.categoryId ? data.categories.get(invoice.categoryId) : null;

    if (!child || !customer || !concourse || !category || !invoice.categoryId || !invoice.customerId || !child.birthDate) {
      validateInvoiceGroup(data, group, skipped);
      continue;
    }

    guardiansById.set(customer.id, {
      legacyCustomerId: customer.id,
      name: customer.name || `Responsável legado ${customer.id}`,
      email: emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id),
      cpf: customer.cpf,
      phone: customer.phone,
      zipCode: customer.zipCode,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    });

    participantsById.set(child.id, {
      legacyChildId: child.id,
      legacyCustomerId: customer.id,
      name: child.name || `Participante legado ${child.id}`,
      slug: legacyChildSlug(child),
      birthDate: child.birthDate.toISOString(),
      gender: child.gender,
      city: customer.city || "Não informado",
      state: customer.state || "NI",
      imageConsentAt: (child.registeredAt ?? new Date()).toISOString(),
      createdAt: toIso(child.registeredAt),
      likes: child.likes,
    });

    const protocol = buildProtocol(concourse.year, invoice.id);
    const status = resolveRegistrationStatus(data, invoice, child);
    const registration = {
      legacyChildId: child.id,
      legacyCustomerId: customer.id,
      legacyContestId: concourse.id,
      legacyCategoryId: invoice.categoryId,
      legacyInvoiceId: invoice.id,
      legacyInvoiceIds: group.map((item) => item.id),
      year: concourse.year,
      protocol,
      status,
      likesCount: child.likes,
      approvedAt: ["APPROVED", "SEMIFINALIST", "WINNER"].includes(status)
        ? toIso(invoice.paidAt ?? invoice.createdAt ?? new Date())
        : null,
      createdAt: toIso(invoice.createdAt ?? child.registeredAt),
    };
    registrations.push(registration);
    registrationsByChildId[String(child.id)] ??= [];
    registrationsByChildId[String(child.id)].push(protocol);

    for (const paymentInvoice of group) {
      payments.push({
        legacyInvoiceId: paymentInvoice.id,
        registrationProtocol: protocol,
        method: resolvePaymentMethod(paymentInvoice),
        status: resolvePaymentStatus(paymentInvoice),
        amountCents: paymentInvoice.returnAmountCents ?? paymentInvoice.amountCents,
        dueDate: toIso(paymentInvoice.dueDate),
        paidAt: toIso(paymentInvoice.paidAt),
        invoiceUrl: paymentInvoice.installmentBilletUrl ?? paymentInvoice.billetUrl,
        pixPayload: paymentInvoice.pixPayload,
        boletoUrl: paymentInvoice.billetUrl ?? paymentInvoice.installmentBilletUrl,
        createdAt: toIso(paymentInvoice.createdAt),
      });
    }
  }

  return {
    meta: {
      sourceFile: sqlFile,
      generatedAt: new Date().toISOString(),
    },
    contests,
    categories,
    guardians: Array.from(guardiansById.values()).sort((left, right) => left.legacyCustomerId - right.legacyCustomerId),
    participants: Array.from(participantsById.values()).sort((left, right) => left.legacyChildId - right.legacyChildId),
    registrations: registrations.sort((left, right) => left.legacyInvoiceId - right.legacyInvoiceId),
    payments: payments.sort((left, right) => left.legacyInvoiceId - right.legacyInvoiceId),
    indexes: { registrationsByChildId },
    skipped: mergeSkipped(skipped),
  };
}

async function syncLegacyImportJson() {
  const inputPath = options.input ?? process.env.LEGACY_IMPORT_JSON ?? LEGACY_IMPORT_JSON_FILE;
  const outputPath = options.output ?? process.env.LEGACY_IMPORT_RESULT ?? LEGACY_IMPORT_RESULT_FILE;
  const normalized = sliceNormalizedImport(
    JSON.parse(await readFile(inputPath, "utf-8")) as NormalizedLegacyImport,
  );
  const result = await syncNormalizedLegacyImport(normalized);
  const mergedResult = mergeSyncResults(readExistingSyncResult(outputPath), result);
  await writeJson(outputPath, mergedResult);
  console.log(
    [
      `Sincronização concluída a partir de ${inputPath}`,
      `Resultado gravado em ${outputPath}`,
      `Concursos: ${Object.keys(mergedResult.contests).length}`,
      `Categorias: ${Object.keys(mergedResult.categories).length}`,
      `Responsáveis: ${Object.keys(mergedResult.guardians).length}`,
      `Participantes: ${Object.keys(mergedResult.children).length}`,
      `Inscrições: ${Object.keys(mergedResult.registrationsByLegacyInvoiceId).length}`,
      `Pagamentos: ${Object.keys(mergedResult.payments).length}`,
    ].join("\n"),
  );
}

function readExistingSyncResult(outputPath: string): SyncResult | null {
  if (!existsSync(outputPath)) return null;
  try {
    return JSON.parse(readFileSync(outputPath, "utf-8")) as SyncResult;
  } catch {
    return null;
  }
}

function mergeSyncResults(existing: SyncResult | null, current: SyncResult): SyncResult {
  if (!existing) return current;
  const registrationsByChildId = { ...existing.registrationsByChildId };
  for (const [childId, registrations] of Object.entries(current.registrationsByChildId)) {
    const byId = new Map((registrationsByChildId[childId] ?? []).map((registration) => [registration.id, registration]));
    for (const registration of registrations) byId.set(registration.id, registration);
    registrationsByChildId[childId] = Array.from(byId.values());
  }

  return {
    contests: { ...existing.contests, ...current.contests },
    categories: { ...existing.categories, ...current.categories },
    guardians: { ...existing.guardians, ...current.guardians },
    children: { ...existing.children, ...current.children },
    registrationsByChildId,
    registrationsByLegacyInvoiceId: {
      ...existing.registrationsByLegacyInvoiceId,
      ...current.registrationsByLegacyInvoiceId,
    },
    payments: { ...existing.payments, ...current.payments },
  };
}

function sliceNormalizedImport(normalized: NormalizedLegacyImport): NormalizedLegacyImport {
  if (!limit && offset === 0) return normalized;

  const registrations = normalized.registrations.slice(offset, limit ? offset + limit : undefined);
  const protocols = new Set(registrations.map((registration) => registration.protocol));
  const legacyChildIds = new Set(registrations.map((registration) => registration.legacyChildId));
  const legacyCustomerIds = new Set(registrations.map((registration) => registration.legacyCustomerId));
  const legacyContestIds = new Set(registrations.map((registration) => registration.legacyContestId));

  return {
    ...normalized,
    guardians: normalized.guardians.filter((guardian) => legacyCustomerIds.has(guardian.legacyCustomerId)),
    participants: normalized.participants.filter((participant) => legacyChildIds.has(participant.legacyChildId)),
    registrations,
    payments: normalized.payments.filter((payment) => protocols.has(payment.registrationProtocol)),
    categories: normalized.categories.filter((category) => legacyContestIds.has(category.legacyContestId)),
    indexes: {
      registrationsByChildId: registrations.reduce<Record<string, string[]>>((accumulator, registration) => {
        accumulator[String(registration.legacyChildId)] ??= [];
        accumulator[String(registration.legacyChildId)].push(registration.protocol);
        return accumulator;
      }, {}),
    },
  };
}

async function syncNormalizedLegacyImport(normalized: NormalizedLegacyImport): Promise<SyncResult> {
  const db = getPrisma();
  const result: SyncResult = {
    contests: {},
    categories: {},
    guardians: {},
    children: {},
    registrationsByChildId: {},
    registrationsByLegacyInvoiceId: {},
    payments: {},
  };
  const passwordHash = await bcrypt.hash(`legacy-import-${randomUUID()}`, 10);

  for (const contestData of normalized.contests) {
    const contest = await db.contest.upsert({
      where: { year: contestData.year },
      create: {
        year: contestData.year,
        name: contestData.name,
        status: contestData.status as ReturnType<typeof resolveContestStatus>,
        registrationFeeCents: contestData.registrationFeeCents,
        frameImageKey: contestData.frameImageKey,
        revealAt: parseIsoDate(contestData.revealAt),
        createdAt: parseIsoDate(contestData.createdAt) ?? undefined,
      },
      update: {
        name: contestData.name,
        status: contestData.status as ReturnType<typeof resolveContestStatus>,
        registrationFeeCents: contestData.registrationFeeCents,
        frameImageKey: contestData.frameImageKey,
        revealAt: parseIsoDate(contestData.revealAt),
      },
      select: { id: true },
    });
    result.contests[String(contestData.legacyId)] = contest.id;
  }

  for (const categoryData of normalized.categories) {
    const contestId = result.contests[String(categoryData.legacyContestId)];
    if (!contestId) continue;
    const category = await db.category.upsert({
      where: { contestId_slug: { contestId, slug: categoryData.slug } },
      create: {
        contestId,
        name: categoryData.name,
        slug: categoryData.slug,
        minAgeMonths: categoryData.minAgeMonths,
        maxAgeMonths: categoryData.maxAgeMonths,
        order: categoryData.order,
      },
      update: {
        name: categoryData.name,
        minAgeMonths: categoryData.minAgeMonths,
        maxAgeMonths: categoryData.maxAgeMonths,
        order: categoryData.order,
      },
      select: { id: true },
    });
    result.categories[`${categoryData.legacyContestId}:${categoryData.legacyCategoryId}`] = category.id;
  }

  for (const guardianData of normalized.guardians) {
    const profile = await syncGuardianProfile(guardianData, passwordHash);
    result.guardians[String(guardianData.legacyCustomerId)] = profile.id;
  }

  for (const participantData of normalized.participants) {
    const guardianId = result.guardians[String(participantData.legacyCustomerId)];
    if (!guardianId) continue;
    const participant = await db.participant.upsert({
      where: { slug: participantData.slug },
      create: {
        guardianId,
        name: participantData.name,
        slug: participantData.slug,
        birthDate: parseRequiredIsoDate(participantData.birthDate),
        gender: participantData.gender,
        city: participantData.city,
        state: participantData.state,
        imageConsentAt: parseIsoDate(participantData.imageConsentAt),
        createdAt: parseIsoDate(participantData.createdAt) ?? undefined,
      },
      update: {
        guardianId,
        name: participantData.name,
        birthDate: parseRequiredIsoDate(participantData.birthDate),
        gender: participantData.gender,
        city: participantData.city,
        state: participantData.state,
        imageConsentAt: parseIsoDate(participantData.imageConsentAt),
      },
      select: { id: true },
    });
    result.children[String(participantData.legacyChildId)] = participant.id;
  }

  for (const registrationData of normalized.registrations) {
    const participantId = result.children[String(registrationData.legacyChildId)];
    const contestId = result.contests[String(registrationData.legacyContestId)];
    const categoryId = result.categories[`${registrationData.legacyContestId}:${registrationData.legacyCategoryId}`];
    if (!participantId || !contestId || !categoryId) continue;

    const existing =
      (await db.registration.findUnique({ where: { protocol: registrationData.protocol }, select: { id: true } })) ??
      (await db.registration.findUnique({
        where: { participantId_contestId: { participantId, contestId } },
        select: { id: true },
      }));

    const data = {
      participantId,
      contestId,
      categoryId,
      status: registrationData.status,
      protocol: registrationData.protocol,
      likesCount: registrationData.likesCount,
      approvedAt: parseIsoDate(registrationData.approvedAt),
      createdAt: parseIsoDate(registrationData.createdAt) ?? undefined,
    };

    const registration = existing
      ? await db.registration.update({
          where: { id: existing.id },
          data: {
            categoryId,
            status: registrationData.status,
            likesCount: registrationData.likesCount,
            approvedAt: parseIsoDate(registrationData.approvedAt),
          },
          select: { id: true, protocol: true, status: true, createdAt: true },
        })
      : await db.registration.create({
          data,
          select: { id: true, protocol: true, status: true, createdAt: true },
        });

    result.registrationsByLegacyInvoiceId[String(registrationData.legacyInvoiceId)] = registration.id;
    for (const legacyInvoiceId of registrationData.legacyInvoiceIds) {
      result.registrationsByLegacyInvoiceId[String(legacyInvoiceId)] = registration.id;
    }
    result.registrationsByChildId[String(registrationData.legacyChildId)] ??= [];
    result.registrationsByChildId[String(registrationData.legacyChildId)].push({
      id: registration.id,
      protocol: registration.protocol,
      year: registrationData.year,
      status: registration.status,
      createdAt: registration.createdAt.toISOString(),
    });
  }

  for (const paymentData of normalized.payments) {
    const registrationId = result.registrationsByLegacyInvoiceId[String(paymentData.legacyInvoiceId)];
    if (!registrationId) continue;
    const existing = await db.payment.findFirst({
      where: {
        registrationId,
        amountCents: paymentData.amountCents,
        createdAt: parseIsoDate(paymentData.createdAt) ?? undefined,
      },
      select: { id: true },
    });
    if (existing) {
      result.payments[String(paymentData.legacyInvoiceId)] = existing.id;
      continue;
    }
    const payment = await db.payment.create({
      data: {
        registrationId,
        method: paymentData.method,
        status: paymentData.status,
        amountCents: paymentData.amountCents,
        dueDate: parseIsoDate(paymentData.dueDate),
        paidAt: parseIsoDate(paymentData.paidAt),
        invoiceUrl: paymentData.invoiceUrl,
        pixPayload: paymentData.pixPayload,
        boletoUrl: paymentData.boletoUrl,
        createdAt: parseIsoDate(paymentData.createdAt) ?? undefined,
      },
      select: { id: true },
    });
    result.payments[String(paymentData.legacyInvoiceId)] = payment.id;
  }

  return result;
}

async function syncGuardianProfile(guardianData: NormalizedLegacyImport["guardians"][number], passwordHash: string) {
  const db = getPrisma();
  const existingProfile = guardianData.cpf
    ? await db.guardianProfile.findUnique({
        where: { cpf: guardianData.cpf },
        include: { user: true },
      })
    : null;

  if (existingProfile) {
    await db.user.update({
      where: { id: existingProfile.userId },
      data: {
        name: guardianData.name,
        email: existingProfile.user.email,
        phone: guardianData.phone,
      },
    });
    return db.guardianProfile.update({
      where: { id: existingProfile.id },
      data: buildGuardianProfileData(guardianData),
      select: { id: true },
    });
  }

  const user = await db.user.upsert({
    where: { email: guardianData.email },
    create: {
      name: guardianData.name,
      email: guardianData.email,
      phone: guardianData.phone,
      passwordHash,
      role: "GUARDIAN",
      requiresPasswordSetup: true,
    },
    update: {
      name: guardianData.name,
      phone: guardianData.phone,
      requiresPasswordSetup: true,
    },
    include: { guardianProfile: true },
  });

  if (user.guardianProfile) {
    return db.guardianProfile.update({
      where: { id: user.guardianProfile.id },
      data: buildGuardianProfileData(guardianData),
      select: { id: true },
    });
  }

  return db.guardianProfile.create({
    data: {
      userId: user.id,
      ...buildGuardianProfileData(guardianData),
    },
    select: { id: true },
  });
}

function buildGuardianProfileData(guardianData: NormalizedLegacyImport["guardians"][number]) {
  return {
    cpf: guardianData.cpf,
    whatsapp: guardianData.phone,
    zipCode: guardianData.zipCode,
    street: guardianData.street,
    number: guardianData.number,
    complement: guardianData.complement,
    neighborhood: guardianData.neighborhood,
    city: guardianData.city,
    state: guardianData.state,
  };
}

async function importContestsAndCategories(
  data: LegacyData,
  idMap: IdMap,
  photoManifest: PhotoManifestEntry[],
) {
  const db = getPrisma();
  const contestMap = new Map<number, { id: string; year: number; categoryIds: Map<number, string> }>();
  const finalistConcourseIds = new Set(data.finalists.map((finalist) => finalist.concourseId).filter(isPresent));

  for (const concourse of data.concourses.values()) {
    if (!Number.isInteger(concourse.year)) continue;

    const status = resolveContestStatus(concourse, finalistConcourseIds);
    const contest = await db.contest.upsert({
      where: { year: concourse.year },
      create: {
        year: concourse.year,
        name: `Criança Mais Fotogênica do Brasil ${concourse.year}`,
        status,
        registrationFeeCents: concourse.amountCents,
        frameImageKey: concourse.frame ? buildFrameStorageKey(concourse.year, concourse.frame) : null,
        revealAt: concourse.revealAt,
        createdAt: concourse.createdAt ?? undefined,
      },
      update: {
        name: `Criança Mais Fotogênica do Brasil ${concourse.year}`,
        status,
        registrationFeeCents: concourse.amountCents,
        frameImageKey: concourse.frame ? buildFrameStorageKey(concourse.year, concourse.frame) : undefined,
        revealAt: concourse.revealAt,
      },
      select: { id: true, year: true },
    });
    idMap.contests[String(concourse.id)] = contest.id;

    const categoryIds = new Map<number, string>();
    for (const category of data.categories.values()) {
      const range = CATEGORY_RANGES[category.id];
      if (!range) continue;
      const saved = await db.category.upsert({
        where: { contestId_slug: { contestId: contest.id, slug: category.slug } },
        create: {
          contestId: contest.id,
          name: category.title,
          slug: category.slug,
          minAgeMonths: range.minAgeMonths,
          maxAgeMonths: range.maxAgeMonths,
          order: category.order,
        },
        update: {
          name: category.title,
          minAgeMonths: range.minAgeMonths,
          maxAgeMonths: range.maxAgeMonths,
          order: category.order,
        },
        select: { id: true },
      });
      categoryIds.set(category.id, saved.id);
      idMap.categories[`${concourse.id}:${category.id}`] = saved.id;
    }

    if (concourse.frame) {
      const sourceUrl = buildSourceUrl(concourse.frame);
      photoManifest.push({
        registrationId: "",
        legacyChildId: 0,
        legacyInvoiceId: null,
        year: concourse.year,
        kind: "frame",
        sourcePath: concourse.frame,
        sourceUrl,
        targetStorageKey: buildFrameStorageKey(concourse.year, concourse.frame),
        order: 0,
        isCover: false,
      });
    }

    contestMap.set(concourse.id, { id: contest.id, year: contest.year, categoryIds });
  }

  return contestMap;
}

async function importGuardians(
  data: LegacyData,
  idMap: IdMap,
  passwordHash: string,
  created: { users: number },
  onlyCustomerIds?: Set<number>,
) {
  const db = getPrisma();
  const guardianMap = new Map<number, string>();
  const emailByCustomer = buildCustomerEmailMap(data.customers);
  const selectedCustomers = Array.from(data.customers.values()).filter(
    (customer) => !onlyCustomerIds || onlyCustomerIds.has(customer.id),
  );
  console.log(`Preparando ${selectedCustomers.length} responsáveis do lote...`);

  const cpfs = unique(selectedCustomers.map((customer) => customer.cpf).filter(isPresent));
  const existingProfilesByCpf = new Map<string, string>();
  if (cpfs.length > 0) {
    const existingProfiles = await db.guardianProfile.findMany({
      where: { cpf: { in: cpfs } },
      select: { id: true, cpf: true },
    });
    for (const profile of existingProfiles) {
      if (profile.cpf) existingProfilesByCpf.set(profile.cpf, profile.id);
    }
  }

  for (const customer of selectedCustomers) {
    const existingProfileId = customer.cpf ? existingProfilesByCpf.get(customer.cpf) : null;
    if (!existingProfileId) continue;
    guardianMap.set(customer.id, existingProfileId);
    idMap.customers[String(customer.id)] = existingProfileId;
  }

  const canonicalCustomers: LegacyCustomer[] = [];
  const duplicateCustomerCpf = new Map<number, string>();
  const canonicalCpf = new Set<string>();
  for (const customer of selectedCustomers) {
    if (guardianMap.has(customer.id)) continue;
    if (customer.cpf) {
      if (canonicalCpf.has(customer.cpf)) {
        duplicateCustomerCpf.set(customer.id, customer.cpf);
        continue;
      }
      canonicalCpf.add(customer.cpf);
    }
    canonicalCustomers.push(customer);
  }

  const emails = unique(
    canonicalCustomers.map((customer) => emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id)),
  );
  const existingUsers = emails.length
    ? await db.user.findMany({
        where: { email: { in: emails } },
        include: { guardianProfile: true },
      })
    : [];
  const existingUsersByEmail = new Map(existingUsers.map((user) => [user.email, user]));

  const usersToCreate = canonicalCustomers.filter((customer) => {
    const email = emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id);
    return !existingUsersByEmail.has(email);
  });

  if (usersToCreate.length > 0) {
    const result = await db.user.createMany({
      data: usersToCreate.map((customer) => ({
        name: customer.name || `Responsável legado ${customer.id}`,
        email: emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id),
        phone: customer.phone,
        passwordHash,
        role: "GUARDIAN",
        requiresPasswordSetup: true,
      })),
      skipDuplicates: true,
    });
    created.users += result.count;
    console.log(`Responsáveis: ${result.count} usuários novos criados.`);
  }

  const users = emails.length
    ? await db.user.findMany({
        where: { email: { in: emails } },
        include: { guardianProfile: true },
      })
    : [];
  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  const profilesToCreate = [];
  for (const customer of canonicalCustomers) {
    const email = emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id);
    const user = usersByEmail.get(email);
    if (!user) continue;
    if (user.guardianProfile) {
      guardianMap.set(customer.id, user.guardianProfile.id);
      idMap.customers[String(customer.id)] = user.guardianProfile.id;
      continue;
    }

    profilesToCreate.push({
      userId: user.id,
      cpf: customer.cpf,
      whatsapp: customer.phone,
      zipCode: customer.zipCode,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    });
  }

  if (profilesToCreate.length > 0) {
    await db.guardianProfile.createMany({ data: profilesToCreate, skipDuplicates: true });
  }

  const profileUserIds = unique(profilesToCreate.map((profile) => profile.userId));
  const savedProfiles = profileUserIds.length
    ? await db.guardianProfile.findMany({
        where: { userId: { in: profileUserIds } },
        select: { id: true, userId: true, cpf: true },
      })
    : [];
  const savedProfilesByUserId = new Map(savedProfiles.map((profile) => [profile.userId, profile]));
  const savedProfilesByCpf = new Map(
    savedProfiles.filter((profile) => profile.cpf).map((profile) => [profile.cpf!, profile]),
  );

  for (const customer of canonicalCustomers) {
    if (guardianMap.has(customer.id)) continue;
    const email = emailByCustomer.get(customer.id) ?? buildTechnicalEmail(customer.id);
    const user = usersByEmail.get(email);
    const profile = user ? savedProfilesByUserId.get(user.id) : null;
    if (!profile) continue;
    guardianMap.set(customer.id, profile.id);
    idMap.customers[String(customer.id)] = profile.id;
  }

  for (const [customerId, cpf] of duplicateCustomerCpf) {
    const profileId =
      guardianMap.get(canonicalCustomers.find((customer) => customer.cpf === cpf)?.id ?? -1) ??
      savedProfilesByCpf.get(cpf)?.id ??
      existingProfilesByCpf.get(cpf);
    if (!profileId) continue;
    guardianMap.set(customerId, profileId);
    idMap.customers[String(customerId)] = profileId;
  }

  return guardianMap;
}

async function ensureParticipant(params: {
  child: LegacyChild;
  customer: LegacyCustomer;
  guardianId: string;
  idMap: IdMap;
  created: { participants: number };
}) {
  const db = getPrisma();
  const slug = legacyChildSlug(params.child);
  const existing = await db.participant.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    params.idMap.children[String(params.child.id)] = existing.id;
    return existing;
  }

  const participant = await db.participant.create({
    data: {
      guardianId: params.guardianId,
      name: params.child.name || `Participante legado ${params.child.id}`,
      slug,
      birthDate: params.child.birthDate!,
      gender: params.child.gender,
      city: params.customer.city || "Não informado",
      state: params.customer.state || "NI",
      imageConsentAt: params.child.registeredAt ?? new Date(),
      createdAt: params.child.registeredAt ?? undefined,
    },
    select: { id: true },
  });

  params.idMap.children[String(params.child.id)] = participant.id;
  params.created.participants += 1;
  return participant;
}

async function ensureRegistration(params: {
  group: LegacyInvoice[];
  invoice: LegacyInvoice;
  child: LegacyChild;
  contestId: string;
  contestYear: number;
  categoryId: string;
  participantId: string;
  status: RegistrationStatusValue;
  idMap: IdMap;
  created: { registrations: number };
}) {
  const db = getPrisma();
  const protocol = buildProtocol(params.contestYear, params.invoice.id);
  const existing = await db.registration.findUnique({ where: { protocol }, select: { id: true } });
  if (existing) {
    for (const invoice of params.group) params.idMap.registrations[String(invoice.id)] = existing.id;
    return existing;
  }

  const registration = await db.registration.create({
    data: {
      participantId: params.participantId,
      contestId: params.contestId,
      categoryId: params.categoryId,
      status: params.status,
      protocol,
      likesCount: params.child.likes,
      approvedAt: ["APPROVED", "SEMIFINALIST", "WINNER"].includes(params.status)
        ? (params.invoice.paidAt ?? params.invoice.createdAt ?? new Date())
        : null,
      createdAt: params.invoice.createdAt ?? params.child.registeredAt ?? undefined,
    },
    select: { id: true },
  });

  for (const invoice of params.group) params.idMap.registrations[String(invoice.id)] = registration.id;
  params.created.registrations += 1;
  return registration;
}

async function ensurePayment(registrationId: string, invoice: LegacyInvoice) {
  const db = getPrisma();
  const existing = await db.payment.findFirst({
    where: {
      registrationId,
      amountCents: invoice.amountCents,
      createdAt: invoice.createdAt ?? undefined,
    },
    select: { id: true },
  });
  if (existing) return null;

  const payment = await db.payment.create({
    data: {
      registrationId,
      method: resolvePaymentMethod(invoice),
      status: resolvePaymentStatus(invoice),
      amountCents: invoice.returnAmountCents ?? invoice.amountCents,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      invoiceUrl: invoice.installmentBilletUrl ?? invoice.billetUrl,
      pixPayload: invoice.pixPayload,
      boletoUrl: invoice.billetUrl ?? invoice.installmentBilletUrl,
      createdAt: invoice.createdAt ?? undefined,
    },
    select: { id: true },
  });
  return payment.id;
}

async function ensurePhotoRows(registrationId: string, entries: PhotoManifestEntry[]) {
  const db = getPrisma();
  for (const entry of entries.filter((item) => item.kind !== "frame")) {
    const existing = await db.photo.findFirst({
      where: { registrationId, storageKey: entry.targetStorageKey },
      select: { id: true },
    });
    if (existing) continue;
    await db.photo.create({
      data: {
        registrationId,
        storageKey: entry.targetStorageKey,
        order: entry.order,
        isCover: entry.isCover,
      },
    });
  }
}

async function importPhotos() {
  const manifestPath = options.manifest ?? process.env.LEGACY_PHOTO_MANIFEST ?? PHOTO_MANIFEST_FILE;
  const raw = await readFile(manifestPath, "utf-8");
  const entries = JSON.parse(raw) as PhotoManifestEntry[];
  const selected = entries.slice(offset, limit ? offset + limit : undefined);
  const { uploadObject } = await import("../src/shared/integrations/s3/storage");
  const db = getPrisma();
  const existingPhotos = await db.photo.findMany({
    where: { registrationId: { in: unique(selected.map((entry) => entry.registrationId).filter(Boolean)) } },
    select: { registrationId: true, storageKey: true },
  });
  const existingPhotoKeys = new Set(
    existingPhotos.map((photo) => `${photo.registrationId}:${photo.storageKey}`),
  );

  let uploaded = 0;
  let skipped = 0;
  let alreadyExists = 0;
  for (const entry of selected) {
    if (entry.kind === "frame" || !entry.registrationId) {
      skipped += 1;
      continue;
    }
    const photoKey = `${entry.registrationId}:${entry.targetStorageKey}`;
    if (existingPhotoKeys.has(photoKey)) {
      alreadyExists += 1;
      continue;
    }

    const response = await fetch(entry.sourceUrl);
    if (!response.ok) {
      skipped += 1;
      console.log(`Foto ignorada (${response.status}): ${entry.sourceUrl}`);
      continue;
    }

    const body = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? contentTypeFromPath(entry.sourcePath);
    await uploadObject(entry.targetStorageKey, body, contentType);
    await ensurePhotoRows(entry.registrationId, [entry]);
    existingPhotoKeys.add(photoKey);
    uploaded += 1;
  }

  console.log(
    `Fotos processadas: ${uploaded} enviadas ao S3, ${alreadyExists} já existiam, ${skipped} ignoradas.`,
  );
}

async function generateFullPhotoManifest(data: LegacyData) {
  const sources = buildPhotoSources(data);
  const registrationsByProtocol = await getRegistrationsByProtocol(
    sources.map((source) => buildProtocol(source.year, source.legacyInvoiceId)),
  );
  const manifest: PhotoManifestEntry[] = [];
  let missingRegistrations = 0;

  for (const source of sources) {
    const registration = registrationsByProtocol.get(buildProtocol(source.year, source.legacyInvoiceId));
    if (!registration) {
      missingRegistrations += 1;
      continue;
    }

    manifest.push(
      ...buildRegistrationPhotoManifest(registration.id, source.year, {
        id: source.legacyInvoiceId,
        concourseId: null,
        categoryId: null,
        customerId: null,
        childId: source.legacyChildId,
        type: null,
        status: null,
        createdAt: null,
        amountCents: 0,
        dueDate: null,
        paidAt: null,
        returnText: null,
        returnAmountCents: null,
        billetUrl: null,
        installmentBilletUrl: null,
        pixPayload: null,
      }, {
        id: source.legacyChildId,
        customerId: null,
        likes: 0,
        registeredAt: null,
        statusSite: 0,
        birthDate: null,
        gender: null,
        name: null,
        picture1: source.picture1,
        officialPicture: source.officialPicture,
        picture2: source.picture2,
        url: null,
        pictureWithFrame: source.pictureWithFrame,
      }),
    );
  }

  await mkdir(reportDir, { recursive: true });
  await writeJson(PHOTO_SOURCES_FILE, sources);
  await writeJson(PHOTO_MANIFEST_FULL_FILE, manifest);
  console.log(
    `Manifesto completo gerado: ${manifest.length} fotos em ${PHOTO_MANIFEST_FULL_FILE}. ` +
      `${missingRegistrations} fontes sem inscrição importada.`,
  );
}

function buildPhotoSources(data: LegacyData): PhotoSourceEntry[] {
  const sources: PhotoSourceEntry[] = [];
  for (const group of groupInvoices(data.invoices).values()) {
    const invoice = selectBestInvoice(group);
    const child = invoice.childId ? data.children.get(invoice.childId) : null;
    const concourse = invoice.concourseId ? data.concourses.get(invoice.concourseId) : null;
    if (!child || !concourse) continue;
    if (!child.picture1 && !child.officialPicture && !child.picture2 && !child.pictureWithFrame) continue;
    sources.push({
      legacyInvoiceId: invoice.id,
      legacyChildId: child.id,
      year: concourse.year,
      picture1: child.picture1,
      officialPicture: child.officialPicture,
      picture2: child.picture2,
      pictureWithFrame: child.pictureWithFrame,
    });
  }
  return sources;
}

async function getRegistrationsByProtocol(protocols: string[]) {
  const db = getPrisma();
  const map = new Map<string, { id: string; protocol: string }>();
  const uniqueProtocols = unique(protocols);
  for (let index = 0; index < uniqueProtocols.length; index += 500) {
    const chunk = uniqueProtocols.slice(index, index + 500);
    const registrations = await db.registration.findMany({
      where: { protocol: { in: chunk } },
      select: { id: true, protocol: true },
    });
    for (const registration of registrations) {
      map.set(registration.protocol, registration);
    }
  }
  return map;
}

function groupInvoices(invoices: LegacyInvoice[]) {
  const groups = new Map<string, LegacyInvoice[]>();
  for (const invoice of invoices) {
    if (!invoice.childId || !invoice.concourseId) continue;
    const key = `${invoice.childId}:${invoice.concourseId}`;
    const group = groups.get(key) ?? [];
    group.push(invoice);
    groups.set(key, group);
  }
  return groups;
}

function selectBestInvoice(group: LegacyInvoice[]) {
  return [...group].sort((left, right) => {
    const paidDiff = Number(isPaidInvoice(right)) - Number(isPaidInvoice(left));
    if (paidDiff !== 0) return paidDiff;
    return right.id - left.id;
  })[0];
}

function findFinalist(data: LegacyData, invoice: LegacyInvoice) {
  return data.finalists.find(
    (finalist) =>
      finalist.childId === invoice.childId &&
      finalist.concourseId === invoice.concourseId &&
      finalist.categoryId === invoice.categoryId,
  );
}

function resolveRegistrationStatus(
  data: LegacyData,
  invoice: LegacyInvoice,
  child: LegacyChild,
): RegistrationStatusValue {
  const finalist = findFinalist(data, invoice);
  if (finalist?.winner === 1) return "WINNER";
  if (finalist) return "SEMIFINALIST";
  if (isPaidInvoice(invoice) && child.statusSite === 1) return "APPROVED";
  if (isPaidInvoice(invoice)) return "UNDER_REVIEW";
  return "PENDING_PAYMENT";
}

function resolveContestStatus(concourse: LegacyConcourse, finalistConcourseIds: Set<number>) {
  if (concourse.status === 1) return "REGISTRATION_OPEN";
  if (finalistConcourseIds.has(concourse.id)) return "RESULTS_PUBLISHED";
  return "ARCHIVED";
}

function resolvePaymentMethod(invoice: LegacyInvoice) {
  const type = (invoice.type ?? "").toLowerCase();
  if (type.includes("cart")) return "CREDIT_CARD";
  if (type.includes("pix")) return "PIX";
  return "BOLETO";
}

function resolvePaymentStatus(invoice: LegacyInvoice) {
  if (!isPaidInvoice(invoice)) return "PENDING";
  return invoice.paidAt ? "RECEIVED" : "CONFIRMED";
}

function isPaidInvoice(invoice: LegacyInvoice) {
  return PAID_STATUSES.has((invoice.status ?? "").trim().toLowerCase());
}

function buildCustomerEmailMap(customers: Map<number, LegacyCustomer>) {
  const seen = new Set<string>();
  const map = new Map<number, string>();
  for (const customer of [...customers.values()].sort((left, right) => left.id - right.id)) {
    if (shouldGenerateTechnicalEmail(customer.email) || !customer.email) {
      map.set(customer.id, buildTechnicalEmail(customer.id));
      continue;
    }
    if (seen.has(customer.email)) {
      map.set(customer.id, buildTechnicalEmail(customer.id));
      continue;
    }
    seen.add(customer.email);
    map.set(customer.id, customer.email);
  }
  return map;
}

function shouldGenerateTechnicalEmail(email: string | null) {
  return !email || FAKE_EMAIL_PATTERN.test(email) || email.endsWith("@import.local");
}

function buildTechnicalEmail(customerId: number) {
  return `legacy-customer-${customerId}@import.local`;
}

function legacyChildSlug(child: LegacyChild) {
  const base = slugify(child.url || child.name || `participante-legado-${child.id}`);
  return `${base || "participante-legado"}-${child.id}`;
}

function buildAnalysisPhotoManifest(data: LegacyData) {
  const entries: PhotoManifestEntry[] = [];
  for (const group of groupInvoices(data.invoices).values()) {
    const invoice = selectBestInvoice(group);
    const child = invoice.childId ? data.children.get(invoice.childId) : null;
    const concourse = invoice.concourseId ? data.concourses.get(invoice.concourseId) : null;
    if (!child || !concourse) continue;
    entries.push(...buildRegistrationPhotoManifest("", concourse.year, invoice, child));
  }
  for (const concourse of data.concourses.values()) {
    if (!concourse.frame) continue;
    entries.push({
      registrationId: "",
      legacyChildId: 0,
      legacyInvoiceId: null,
      year: concourse.year,
      kind: "frame",
      sourcePath: concourse.frame,
      sourceUrl: buildSourceUrl(concourse.frame),
      targetStorageKey: buildFrameStorageKey(concourse.year, concourse.frame),
      order: 0,
      isCover: false,
    });
  }
  return entries;
}

function buildRegistrationPhotoManifest(
  registrationId: string,
  year: number,
  invoice: LegacyInvoice,
  child: LegacyChild,
) {
  const photos: Array<{ kind: PhotoManifestEntry["kind"]; sourcePath: string | null; order: number; isCover: boolean }> = [
    { kind: "official", sourcePath: child.officialPicture, order: 0, isCover: true },
    { kind: "picture1", sourcePath: child.picture1, order: child.officialPicture ? 1 : 0, isCover: !child.officialPicture },
    { kind: "picture2", sourcePath: child.picture2, order: 2, isCover: false },
    { kind: "framed", sourcePath: child.pictureWithFrame, order: 3, isCover: false },
  ];

  const seen = new Set<string>();
  return photos.flatMap((photo) => {
    if (!photo.sourcePath || seen.has(photo.sourcePath)) return [];
    seen.add(photo.sourcePath);
    const sourceUrl = buildSourceUrl(photo.sourcePath);
    const targetStorageKey = buildPhotoStorageKey(year, registrationId || `legacy-${invoice.id}`, photo.kind, photo.sourcePath);
    return [
      {
        registrationId,
        legacyChildId: child.id,
        legacyInvoiceId: invoice.id,
        year,
        kind: photo.kind,
        sourcePath: photo.sourcePath,
        sourceUrl,
        targetStorageKey,
        order: photo.order,
        isCover: photo.isCover,
      },
    ];
  });
}

function buildSourceUrl(sourcePath: string) {
  if (/^https?:\/\//i.test(sourcePath)) return sourcePath;
  return new URL(sourcePath.replace(/^\/+/, ""), photoBaseUrl).toString();
}

function buildPhotoStorageKey(year: number, registrationId: string, kind: string, sourcePath: string) {
  const fileName = safeFileName(sourcePath);
  return `contests/${year}/registrations/${registrationId}/legacy-${kind}-${fileName}`;
}

function buildFrameStorageKey(year: number, sourcePath: string) {
  const ext = extensionFromPath(sourcePath) || "png";
  return `contests/${year}/frame-legacy.${ext}`;
}

function safeFileName(sourcePath: string) {
  const fileName = sourcePath.split("/").pop() || "foto.jpg";
  return slugify(fileName.replace(/\.[^.]+$/, "")) + `.${extensionFromPath(fileName) || "jpg"}`;
}

function contentTypeFromPath(sourcePath: string) {
  const ext = extensionFromPath(sourcePath);
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionFromPath(sourcePath: string) {
  const match = sourcePath.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
  return match?.[1] ?? null;
}

async function writeReports(
  outputDir: string,
  reports: {
    analysis: unknown;
    skipped: SkippedRecord[];
    idMap: IdMap;
    photoManifest: PhotoManifestEntry[];
  },
) {
  await mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, "analysis.json"), reports.analysis);
  await writeJson(path.join(outputDir, "skipped.json"), reports.skipped);
  await writeJson(path.join(outputDir, "id-map.json"), reports.idMap);
  await writeJson(path.join(outputDir, "photos-manifest.json"), reports.photoManifest);
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function printAnalysis(analysis: ReturnType<typeof analyzeLegacyData>) {
  console.log("Análise concluída.");
  console.log(`Tabelas: ${JSON.stringify(analysis.tables)}`);
  console.log(`Avisos: ${JSON.stringify(analysis.warnings)}`);
  console.log(`Exceções previstas: ${analysis.skipped.length}`);
  console.log(`Relatórios gravados em ${reportDir}.`);
}

function mergeSkipped(...groups: SkippedRecord[][]) {
  const seen = new Set<string>();
  const merged: SkippedRecord[] = [];
  for (const group of groups) {
    for (const item of group) {
      const key = `${item.scope}:${item.legacyId}:${item.reason}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

async function uploadLegacyImagesFromFolder() {
  const zipKey = options.zipKey ?? process.env.LEGACY_IMAGES_ZIP_KEY ?? LEGACY_PARTICIPANTS_ZIP_KEY;
  const zipRoot = normalizeOptionalZipRoot(
    options.zipRoot ?? process.env.LEGACY_IMAGES_ZIP_ROOT ?? LEGACY_PARTICIPANTS_ZIP_ROOT,
  );
  const bucket = process.env.S3_BUCKET;
  const tempImagesDir = path.join(tmpdir(), "ccmf-legacy-participants-images");
  const usingZip = !options.imagesDir && !process.env.LEGACY_IMAGES_DIR;
  const imagesDir =
    options.imagesDir ??
    process.env.LEGACY_IMAGES_DIR ??
    (bucket ? await extractLegacyImagesZipFromS3(bucket, zipKey, zipRoot, tempImagesDir) : null);
  if (!imagesDir) {
    throw new Error(
      "Informe --imagesDir=/caminho/das/imagens ou configure S3_BUCKET para baixar participants.zip do bucket.",
    );
  }

  const resultPath = options.result ?? process.env.LEGACY_IMPORT_RESULT ?? LEGACY_IMPORT_RESULT_FILE;
  const importDataPath = options.input ?? process.env.LEGACY_IMPORT_JSON ?? LEGACY_IMPORT_JSON_FILE;
  const execute = readBoolean(options.execute);
  const force = readBoolean(options.force);
  const syncResult = JSON.parse(await readFile(resultPath, "utf-8")) as SyncResult;
  const importData = existsSync(importDataPath)
    ? (JSON.parse(await readFile(importDataPath, "utf-8")) as NormalizedLegacyImport)
    : null;
  const files = await listImageFiles(imagesDir);
  const grouped = groupImageFilesByChildId(files);
  const childIds = Array.from(grouped.keys());
  const registrationResolver = await buildRegistrationResolver(syncResult, importData, childIds);
  const coveredFromResult = childIds.filter((childId) =>
    Boolean(chooseRegistrationForChild(syncResult, childId)),
  ).length;

  const report = {
    imagesDir,
    zipKey: options.imagesDir || process.env.LEGACY_IMAGES_DIR ? null : zipKey,
    zipRoot,
    resultPath,
    importDataPath,
    execute,
    scanned: files.length,
    resolvedChildren: registrationResolver.size,
    uploaded: 0,
    deletedPhotos: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: [] as Array<{ filePath: string; reason: string }>,
  };

  console.log(
    [
      `Imagens encontradas: ${files.length}`,
      `Crianças com imagens: ${grouped.size}`,
      `Inscrições resolvidas: ${registrationResolver.size}/${grouped.size} (${coveredFromResult} via import-result, ${registrationResolver.size - coveredFromResult} via banco/import-data)`,
      execute ? "Modo: EXECUTE" : "Modo: DRY-RUN",
      force ? "Force: sim (apaga fotos antigas da inscrição e reenvia tudo)" : "Force: não",
    ].join("\n"),
  );

  if (!execute) {
    for (const [childId, childFiles] of Array.from(grouped.entries()).slice(0, 10)) {
      const registration = registrationResolver.get(childId);
      console.log(
        registration
          ? `[ok] child_id=${childId}: ${childFiles.length} arquivo(s) -> ${registration.id}`
          : `[missing] child_id=${childId}: sem inscrição importada`,
      );
    }
    await writeJson(LEGACY_IMAGE_UPLOAD_REPORT_FILE, report);
    console.log(`Relatório dry-run gravado em ${LEGACY_IMAGE_UPLOAD_REPORT_FILE}. Use --execute para aplicar.`);
    if (usingZip) {
      await rm(tempImagesDir, { recursive: true, force: true });
    }
    return;
  }

  const uploadBucket = requireEnv("S3_BUCKET");
  const s3Client = createS3Client();
  const db = getPrisma();

  for (const [childId, childFiles] of grouped) {
    const registration = registrationResolver.get(childId);
    if (!registration) {
      for (const filePath of childFiles) {
        report.skipped.push({
          filePath,
          reason: `Sem inscrição importada para child_id=${childId}. Rode legacy:sync-data completo ou confira import-data.json.`,
        });
      }
      continue;
    }

    const orderedFiles = [...childFiles].sort((left, right) => path.basename(left).localeCompare(path.basename(right)));

    if (force) {
      report.deletedPhotos += await replaceRegistrationPhotos({
        db,
        s3Client,
        bucket: uploadBucket,
        registrationId: registration.id,
      });
    }

    for (const [index, filePath] of orderedFiles.entries()) {
      const body = await readFile(filePath);
      if (!isLikelyImage(body)) {
        report.skipped.push({ filePath, reason: "Arquivo não parece ser uma imagem válida." });
        continue;
      }

      const storageKey = buildLocalLegacyPhotoStorageKey(registration.year, registration.id, index, filePath);
      if (force || !(await photoObjectExists(s3Client, uploadBucket, storageKey))) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: storageKey,
            Body: body,
            ContentLength: body.length,
            ContentType: contentTypeFromPath(filePath),
          }),
        );
        report.uploaded += 1;
      } else {
        report.skipped.push({ filePath, reason: "Objeto já existe no S3. Use --force para reenviar." });
        continue;
      }

      const sync = await syncLocalPhotoRecord(db, registration.id, storageKey, index, index === 0, force);
      if (sync === "created") report.created += 1;
      else if (sync === "updated") report.updated += 1;
      else report.unchanged += 1;
    }
  }

  await writeJson(LEGACY_IMAGE_UPLOAD_REPORT_FILE, report);
  console.log(
    [
      `Upload concluído: ${report.uploaded} objeto(s) enviados ao S3`,
      `Fotos antigas removidas: ${report.deletedPhotos}`,
      `Banco: ${report.created} criados, ${report.updated} atualizados, ${report.unchanged} inalterados`,
      `Ignorados: ${report.skipped.length}`,
      `Relatório: ${LEGACY_IMAGE_UPLOAD_REPORT_FILE}`,
    ].join("\n"),
  );

  if (usingZip) {
    await rm(tempImagesDir, { recursive: true, force: true });
  }
}

async function extractLegacyImagesZipFromS3(
  bucket: string,
  zipKey: string,
  zipRoot: string | null,
  destinationDir: string,
) {
  const s3Client = createS3Client();
  const tempZipPath = path.join(tmpdir(), `ccmf-${path.basename(zipKey)}`);
  await rm(destinationDir, { recursive: true, force: true });
  await mkdir(destinationDir, { recursive: true });

  console.log(`Baixando s3://${bucket}/${zipKey}...`);
  await downloadS3Object(s3Client, bucket, zipKey, tempZipPath);

  console.log(`Extraindo imagens do zip${zipRoot ? ` em ${zipRoot}` : ""}...`);
  const extractedDir = await extractImageZip(tempZipPath, destinationDir, zipRoot);
  await rm(tempZipPath, { force: true });
  return extractedDir;
}

async function downloadS3Object(s3Client: S3Client, bucket: string, key: string, destination: string) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error(`Objeto sem Body: s3://${bucket}/${key}`);
  await pipeline(response.Body as Readable, createWriteStream(destination));
}

async function extractImageZip(zipPath: string, destinationDir: string, zipRoot: string | null) {
  const zip = await openZip(zipPath);
  let extracted = 0;

  await new Promise<void>((resolve, reject) => {
    zip.readEntry();
    zip.on("entry", (entry) => {
      if (entry.fileName.endsWith("/")) {
        zip.readEntry();
        return;
      }

      const normalizedName = normalizeZipPath(entry.fileName);
      const relativeName = zipRoot ? stripZipRoot(normalizedName, zipRoot) : normalizedName;
      if (!relativeName || normalizedName.includes("__MACOSX/") || path.basename(relativeName).startsWith(".")) {
        zip.readEntry();
        return;
      }
      if (!isSupportedImagePath(relativeName)) {
        zip.readEntry();
        return;
      }

      zip.openReadStream(entry, async (error, stream) => {
        if (error || !stream) {
          reject(error ?? new Error(`Falha ao ler ${entry.fileName}`));
          return;
        }

        try {
          const outputPath = path.join(destinationDir, relativeName);
          await mkdir(path.dirname(outputPath), { recursive: true });
          await pipeline(stream, createWriteStream(outputPath));
          extracted += 1;
          zip.readEntry();
        } catch (extractError) {
          reject(extractError);
        }
      });
    });
    zip.on("end", resolve);
    zip.on("error", reject);
  });

  if (extracted === 0) {
    throw new Error(`Nenhuma imagem encontrada no zip com zipRoot="${zipRoot ?? "(raiz)"}".`);
  }

  console.log(`Imagens extraídas: ${extracted}`);
  return destinationDir;
}

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) reject(error ?? new Error("Falha ao abrir zip."));
      else resolve(zip);
    });
  });
}

function normalizeZipPath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function stripZipRoot(fileName: string, zipRoot: string) {
  if (fileName === zipRoot.replace(/\/$/, "")) return null;
  if (!fileName.startsWith(zipRoot)) return null;
  return fileName.slice(zipRoot.length).replace(/^\/+/, "");
}

function normalizeOptionalZipRoot(value: string | undefined) {
  if (!value || value === "." || value === "/") return null;
  return `${value.replace(/^\/+|\/+$/g, "")}/`;
}

async function listImageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listImageFiles(entryPath));
      continue;
    }
    if (!entry.isFile() || !isSupportedImagePath(entry.name)) continue;
    files.push(entryPath);
  }

  return files;
}

function groupImageFilesByChildId(files: string[]) {
  const grouped = new Map<number, string[]>();
  for (const filePath of files) {
    const match = path.basename(filePath).match(/^(\d+)/);
    if (!match) continue;
    const childId = Number.parseInt(match[1], 10);
    const group = grouped.get(childId) ?? [];
    group.push(filePath);
    grouped.set(childId, group);
  }
  return grouped;
}

type ResolvedRegistration = {
  id: string;
  protocol: string;
  year: number;
  status: string;
  createdAt: string | null;
};

const REGISTRATION_STATUS_PRIORITY: Record<string, number> = {
  WINNER: 5,
  SEMIFINALIST: 4,
  APPROVED: 3,
  UNDER_REVIEW: 2,
  PAID: 1,
  PENDING_PAYMENT: 0,
};

function chooseRegistrationForChild(syncResult: SyncResult, childId: number) {
  const registrations = syncResult.registrationsByChildId[String(childId)] ?? [];
  if (registrations.length === 0) return null;
  return sortRegistrationsByPriority(registrations)[0];
}

function chooseRegistrationFromImportData(importData: NormalizedLegacyImport, childId: number) {
  const registrations = importData.registrations.filter((registration) => registration.legacyChildId === childId);
  if (registrations.length === 0) return null;
  return sortRegistrationsByPriority(
    registrations.map((registration) => ({
      protocol: registration.protocol,
      year: registration.year,
      status: registration.status,
      createdAt: registration.createdAt,
    })),
  )[0];
}

function sortRegistrationsByPriority<T extends { status: string; year: number; createdAt: string | null }>(
  registrations: T[],
) {
  return [...registrations].sort((left, right) => {
    const statusDiff =
      (REGISTRATION_STATUS_PRIORITY[right.status] ?? 0) - (REGISTRATION_STATUS_PRIORITY[left.status] ?? 0);
    if (statusDiff !== 0) return statusDiff;
    if (right.year !== left.year) return right.year - left.year;
    return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
  });
}

async function buildRegistrationResolver(
  syncResult: SyncResult,
  importData: NormalizedLegacyImport | null,
  childIds: number[],
) {
  const resolver = new Map<number, ResolvedRegistration>();

  for (const childId of childIds) {
    const fromResult = chooseRegistrationForChild(syncResult, childId);
    if (fromResult) resolver.set(childId, fromResult);
  }

  if (!importData) return resolver;

  const missingChildIds = childIds.filter((childId) => !resolver.has(childId));
  if (missingChildIds.length === 0) return resolver;

  const protocolsByChild = new Map<number, string>();
  for (const childId of missingChildIds) {
    const registration = chooseRegistrationFromImportData(importData, childId);
    if (registration) protocolsByChild.set(childId, registration.protocol);
  }

  const protocols = Array.from(protocolsByChild.values());
  if (protocols.length === 0) return resolver;

  const db = getPrisma();
  const registrations = await db.registration.findMany({
    where: { protocol: { in: protocols } },
    select: {
      id: true,
      protocol: true,
      status: true,
      createdAt: true,
      contest: { select: { year: true } },
    },
  });
  const byProtocol = new Map(registrations.map((registration) => [registration.protocol, registration]));

  for (const [childId, protocol] of protocolsByChild) {
    const registration = byProtocol.get(protocol);
    if (!registration) continue;
    resolver.set(childId, {
      id: registration.id,
      protocol: registration.protocol,
      year: registration.contest.year,
      status: registration.status,
      createdAt: registration.createdAt.toISOString(),
    });
  }

  return resolver;
}

async function replaceRegistrationPhotos(params: {
  db: PrismaClient;
  s3Client: S3Client;
  bucket: string;
  registrationId: string;
}) {
  const existing = await params.db.photo.findMany({
    where: { registrationId: params.registrationId },
    select: { storageKey: true },
  });
  if (existing.length === 0) return 0;

  for (const photo of existing) {
    try {
      await params.s3Client.send(
        new DeleteObjectCommand({
          Bucket: params.bucket,
          Key: photo.storageKey,
        }),
      );
    } catch {
      // Objeto pode já ter sido removido manualmente do bucket.
    }
  }

  await params.db.photo.deleteMany({ where: { registrationId: params.registrationId } });
  return existing.length;
}

async function syncLocalPhotoRecord(
  db: PrismaClient,
  registrationId: string,
  storageKey: string,
  order: number,
  isCover: boolean,
  force = false,
) {
  if (force) {
    await db.photo.create({
      data: { registrationId, storageKey, order, isCover },
    });
    return "created" as const;
  }

  const existingByOrder = await db.photo.findFirst({
    where: { registrationId, order },
    select: { id: true, storageKey: true, isCover: true },
  });

  if (existingByOrder) {
    if (existingByOrder.storageKey !== storageKey || existingByOrder.isCover !== isCover) {
      await db.photo.update({
        where: { id: existingByOrder.id },
        data: { storageKey, isCover },
      });
      return "updated" as const;
    }
    return "unchanged" as const;
  }

  await db.photo.create({
    data: { registrationId, storageKey, order, isCover },
  });
  return "created" as const;
}

async function photoObjectExists(s3Client: S3Client, bucket: string, key: string) {
  if (readBoolean(options.skipExistingCheck)) return false;
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function createS3Client() {
  return new S3Client({
    region: requireEnv("S3_REGION"),
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
}

function buildLocalLegacyPhotoStorageKey(year: number, registrationId: string, order: number, filePath: string) {
  return `contests/${year}/registrations/${registrationId}/legacy-${String(order).padStart(2, "0")}-${safeFileName(filePath)}`;
}

function isSupportedImagePath(filePath: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(filePath);
}

function isLikelyImage(body: Buffer) {
  if (body.length < 12) return false;
  if (body[0] === 0xff && body[1] === 0xd8) return true;
  if (body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47) return true;
  if (body[0] === 0x47 && body[1] === 0x49 && body[2] === 0x46) return true;
  return body.slice(0, 4).toString("ascii") === "RIFF" && body.slice(8, 12).toString("ascii") === "WEBP";
}

function parseIsoDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRequiredIsoDate(value: string) {
  const date = parseIsoDate(value);
  if (!date) throw new Error(`Data ISO inválida: ${value}`);
  return date;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada.`);
  return value;
}

function getPrisma() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

function emptyIdMap(): IdMap {
  return {
    contests: {},
    categories: {},
    customers: {},
    children: {},
    registrations: {},
    invoices: {},
    payments: {},
  };
}

function asString(value: SqlValue): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function cleanString(value: SqlValue): string | null {
  const string = asString(value)?.trim();
  return string || null;
}

function cleanPath(value: SqlValue): string | null {
  const string = cleanString(value);
  if (!string || string.toLowerCase() === "null") return null;
  return string;
}

function asInt(value: SqlValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function requiredInt(value: SqlValue, field: string): number {
  const number = asInt(value);
  if (number === null) throw new Error(`Campo obrigatório inválido: ${field}`);
  return number;
}

function requiredString(value: SqlValue, field: string): string {
  const string = cleanString(value);
  if (!string) throw new Error(`Campo obrigatório inválido: ${field}`);
  return string;
}

function normalizeDigits(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits || null;
}

function normalizePhone(value: string | null) {
  const digits = normalizeDigits(value);
  return digits && digits.length >= 8 ? digits : null;
}

function normalizeEmail(value: string | null) {
  const email = value?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeState(value: string | null) {
  const state = value?.trim().toUpperCase();
  return state && /^[A-Z]{2}$/.test(state) ? state : null;
}

function parseGender(value: string | null): "MALE" | "FEMALE" | null {
  const gender = value?.trim().toLowerCase();
  if (!gender) return null;
  if (gender.startsWith("masc")) return "MALE";
  if (gender.startsWith("fem")) return "FEMALE";
  return null;
}

function parseLegacyDate(value: SqlValue): Date | null {
  const string = asString(value)?.trim();
  if (!string || string === "0000-00-00" || string === "0000-00-00 00:00:00") return null;
  const iso = string.includes(" ") ? string.replace(" ", "T") : `${string}T00:00:00`;
  const date = new Date(`${iso}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
