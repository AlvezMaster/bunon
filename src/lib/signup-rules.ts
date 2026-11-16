/**
 * Sign-up checks shared by the form and the server. Factory details are self-declared: we check the
 * format of each number, not that a government register lists it (that comes after the hackathon).
 */

export type Association = "BGMEA" | "BKMEA" | "none";

export interface SignupInput {
  role: "factory" | "buyer";
  company: string;
  fullName: string;
  email: string;
  password: string;
  invite?: string;
  // Factory profile
  address?: string;
  district?: string;
  workers?: number | string;
  tradeLicence?: string;
  bin?: string;
  erc?: string;
  association?: Association;
  membershipNo?: string;
  difeLicence?: string;
  declaration?: boolean;
}

export type SignupErrors = Partial<Record<keyof SignupInput, string>>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const REF = /^[A-Za-z0-9][A-Za-z0-9/\-. ]{2,39}$/;

/** Bangladesh VAT BIN: 13 digits, often written 9 + 4 with a dash. */
export const normaliseBin = (v: string) => v.replace(/[\s-]/g, "");

export function checkAccount(i: SignupInput): SignupErrors {
  const e: SignupErrors = {};
  if (i.role !== "factory" && i.role !== "buyer") e.role = "Choose factory or buyer.";
  if (str(i.company).length < 2 || str(i.company).length > 120) e.company = "Enter your company's name.";
  if (str(i.fullName).length < 2 || str(i.fullName).length > 80) e.fullName = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(i.email)) || str(i.email).length > 160) e.email = "Enter a valid email address.";
  if (typeof i.password !== "string" || i.password.length < 10) e.password = "Use at least 10 characters.";
  else if (i.password.length > 200) e.password = "That passphrase is too long.";
  return e;
}

export function checkFactoryProfile(i: SignupInput): SignupErrors {
  const e: SignupErrors = {};
  if (str(i.address).length < 8 || str(i.address).length > 200) e.address = "Enter the factory's full address.";
  if (str(i.district).length < 2 || str(i.district).length > 40) e.district = "Enter the district.";
  const workers = Number(i.workers);
  if (!Number.isInteger(workers) || workers < 1 || workers > 200000) e.workers = "Enter the number of workers.";
  if (!REF.test(str(i.tradeLicence))) e.tradeLicence = "Enter the trade licence number as printed.";
  if (!/^\d{13}$/.test(normaliseBin(str(i.bin)))) e.bin = "A BIN has 13 digits.";
  if (!REF.test(str(i.erc))) e.erc = "Enter the ERC number as printed.";
  if (!["BGMEA", "BKMEA", "none"].includes(str(i.association))) e.association = "Choose your association.";
  else if (i.association !== "none" && !/^[A-Za-z0-9/\-]{1,20}$/.test(str(i.membershipNo))) e.membershipNo = "Enter your membership number.";
  if (!REF.test(str(i.difeLicence))) e.difeLicence = "Enter the DIFE factory licence number.";
  if (i.declaration !== true) e.declaration = "Confirm the details are true.";
  return e;
}

export function checkSignup(i: SignupInput): SignupErrors {
  return { ...checkAccount(i), ...(i.role === "factory" ? checkFactoryProfile(i) : {}) };
}
