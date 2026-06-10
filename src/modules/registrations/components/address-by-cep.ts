/** Consulta endereço pelo CEP (ViaCEP — uso no client do wizard). */

export type AddressByCep = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(rawCep: string): Promise<AddressByCep | null> {
  const zipCode = rawCep.replace(/\D/g, "");
  if (zipCode.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro || !data.localidade || !data.uf) return null;

  return {
    zipCode,
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade,
    state: data.uf,
  };
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
