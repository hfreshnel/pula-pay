


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function sanitizeMsisdn(v) {
  return String(v).replace(/[^\d]/g, "");
}