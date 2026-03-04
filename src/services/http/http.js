import axios from 'axios'

const UrlBase = "https://cima.aemps.es/cima/rest"
const UrlBaseCimaVet = "https://cimavet.aemps.es/cimavet/rest"
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
  if (!proxy) return url
  return proxy.replace('{url}', encodeURIComponent(url))
}

export function resolveCimaVetUrl(url) {
  if (import.meta.env.DEV) return url.replace('https://cimavet.aemps.es', '')
  const proxy = getCorsProxyUrl()
  if (!proxy) return url
  return proxy.replace('{url}', encodeURIComponent(url))
}

// --- CIMA (humanos) ---

export async function getDrugsByName(name) {
  const p = await axios.get(`${UrlBase}/medicamentos?nombre=${name}`)
  return p.data
}

export async function getMedicamentoByIdFromUrl(nregistro) {
  const p = await axios.get(`${UrlBase}/medicamento?nregistro=${nregistro}`)
  return p.data
}

// --- CIMAVet (veterinario) ---

export async function getDrugsByNameVet(name) {
  const p = await axios.get(`${UrlBaseCimaVet}/medicamentos?nombre=${name}`)
  return p.data
}

export async function getMedicamentoByIdFromUrlVet(nregistro) {
  const p = await axios.get(`${UrlBaseCimaVet}/medicamento?nregistro=${nregistro}`)
  return p.data
}

// --- Funciones unificadas ---

export async function searchDrugs(name, esMascota = false) {
  return esMascota ? getDrugsByNameVet(name) : getDrugsByName(name)
}

export async function getMedicamentoDetalle(nregistro, esMascota = false) {
  return esMascota ? getMedicamentoByIdFromUrlVet(nregistro) : getMedicamentoByIdFromUrl(nregistro)
}

export async function getStringUrl(url) {
  const p = await axios.get(url)
  return p.data
}
