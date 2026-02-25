import axios from 'axios'

const UrlBase = "https://cima.aemps.es/cima/rest";
const PROXY_STORAGE_KEY = 'medapp_cors_proxy_url'

export function setCorsProxyUrl(url) {
  if (url) localStorage.setItem(PROXY_STORAGE_KEY, url)
  else localStorage.removeItem(PROXY_STORAGE_KEY)
}

export function getCorsProxyUrl() {
  return localStorage.getItem(PROXY_STORAGE_KEY) || ''
}

export function hasCorsProxy() {
  return import.meta.env.DEV || !!getCorsProxyUrl()
}

export function resolveCimaUrl(url) {
  if (import.meta.env.DEV) return url.replace('https://cima.aemps.es', '')
  const proxy = getCorsProxyUrl()
  if (!proxy) return url // Intento directo (funcionará si no hay bloqueo CORS)
  return proxy.replace('{url}', encodeURIComponent(url))
}

export async function getDrugsByName(name) {
    let p = await axios
      .get(`${UrlBase}/medicamentos?nombre=${name}`);
    return p.data;
}

export async function getStringUrl(url) {
  let p = await axios
      .get(url);
    return p.data;
}

export async function getMedicamentoByIdFromUrl(nregistro) {
  let p = await axios
      .get(`${UrlBase}/medicamento?nregistro=${nregistro}`);
    return p.data;
}