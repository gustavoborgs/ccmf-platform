import "dotenv/config";
import assert from "node:assert";
import {
  checkCpfExists,
  createRegistration,
  ensureGuardian,
  linkGuardianByCpf,
  resolveResumeLink,
  resumeEnrollment,
} from "../src/modules/registrations/service";
import { requestPhotoUpload } from "../src/modules/media/service";
import { getActiveContest } from "../src/modules/contests/service";
import { db } from "../src/shared/db";

/** Teste E2E do fluxo de inscrição (backend): npx tsx scripts/test-enrollment-flow.ts */

const TEST_CPF = "99988877766";

async function cleanup() {
  const guardian = await db.guardianProfile.findUnique({ where: { cpf: TEST_CPF } });
  if (!guardian) return;
  const participants = await db.participant.findMany({ where: { guardianId: guardian.id } });
  for (const participant of participants) {
    await db.registration.deleteMany({ where: { participantId: participant.id } });
  }
  await db.participant.deleteMany({ where: { guardianId: guardian.id } });
  await db.guardianProfile.delete({ where: { id: guardian.id } });
  await db.user.delete({ where: { id: guardian.userId } });
  await db.lead.deleteMany({ where: { cpf: TEST_CPF } });
}

async function main() {
  await cleanup();

  const contest = await getActiveContest();
  assert(contest, "Concurso ativo não encontrado (rode o seed)");

  // Step 1 — CPF novo cria conta
  assert.equal(await checkCpfExists(TEST_CPF), false, "CPF de teste não deveria existir");
  const created = await ensureGuardian({
    cpf: TEST_CPF,
    name: "Teste Fluxo",
    email: "teste-fluxo@example.com",
    phone: "43999990000",
    password: "senha-teste-123",
    zipCode: "86010000",
    street: "Rua Teste",
    number: "100",
    neighborhood: "Centro",
    city: "Londrina",
    state: "PR",
  });
  assert.equal(created.linked, false);
  console.log("✓ step 1: conta criada", created.guardianId);

  // Step 1 — CPF existente vincula sem autenticar
  const linked = await linkGuardianByCpf(TEST_CPF);
  assert(linked?.linked, "Deveria vincular CPF existente");
  console.log("✓ step 1: vínculo por CPF existente");

  // Step 2a — participante (4 anos → Infantil)
  const birth = new Date();
  birth.setFullYear(birth.getFullYear() - 4);
  const registration = await createRegistration({
    guardianId: created.guardianId,
    contestId: contest.id,
    participant: {
      name: "Criança Teste",
      birthDate: birth,
      city: "Londrina",
      state: "PR",
      imageConsent: true,
    },
  });
  assert.equal(registration.category.name, "Infantil", "Categoria deveria ser Infantil");
  console.log("✓ step 2a: inscrição", registration.protocol, "→", registration.category.name);

  // Step 2b — presign + upload real (MinIO)
  for (const index of [1, 2]) {
    const { uploadUrl } = await requestPhotoUpload({
      registrationId: registration.id,
      fileName: `foto-${index}.jpg`,
      contentType: "image/jpeg",
      width: 900,
      height: 1200,
    });
    const body = Buffer.from(`fake-jpeg-${index}`);
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body,
    });
    assert(put.ok, `PUT da foto ${index} falhou: ${put.status}`);
  }
  console.log("✓ step 2b: 2 fotos enviadas ao MinIO via presigned URL");

  // Limite de 2 fotos
  await assert.rejects(
    requestPhotoUpload({
      registrationId: registration.id,
      fileName: "foto-3.jpg",
      contentType: "image/jpeg",
      width: 900,
      height: 1200,
    }),
    /Limite/,
  );
  console.log("✓ limite de 2 fotos respeitado");

  // Proporção 3:4 obrigatória
  await assert.rejects(
    requestPhotoUpload({
      registrationId: registration.id,
      fileName: "quadrada.jpg",
      contentType: "image/jpeg",
      width: 1000,
      height: 1000,
    }),
    /3:4/,
  );
  console.log("✓ proporção 3:4 validada");

  // Retomada
  const resume = await resumeEnrollment(created.guardianId, contest.id);
  assert.equal(resume.step, "CHECKOUT", "Com 2 fotos deveria estar em CHECKOUT");
  const link = await resolveResumeLink(registration.id);
  assert(link?.kind === "WIZARD" && link.step === "CHECKOUT");
  console.log("✓ retomada: step derivado = CHECKOUT");

  await cleanup();
  console.log("\nFluxo de inscrição validado com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
