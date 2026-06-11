import "dotenv/config";

import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildProtocol, slugify } from "../src/shared/utils";

type Command = "analyze" | "import" | "photo-manifest" | "photos";
type SqlValue = string | number | null;
type RegistrationStatusValue =
  | "PENDING_PAYMENT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SEMIFINALIST"
  | "WINNER";

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

  const data = await parseLegacyDump(sqlFile);
  const analysis = analyzeLegacyData(data);

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
  if (input === "analyze" || input === "import" || input === "photo-manifest" || input === "photos") return input;
  throw new Error(`Comando inválido "${input}". Use analyze, import, photo-manifest ou photos.`);
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
