/** Text documents a contract can be: PDF, Word, plain text, RTF and OpenDocument. */
export const CONTRACT_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];

export function isContractFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return CONTRACT_TYPES.some((ext) => name.endsWith(ext));
}
