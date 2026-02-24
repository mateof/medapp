import axios from 'axios'

// const axiosInstance = axios.create({
//     headers: {
//       "Access-Control-Allow-Origin": "*"
//     }
//   });

const UrlBase = "https://cima.aemps.es/cima/rest";

export function resolveCimaUrl(url) {
  if (import.meta.env.DEV) return url.replace('https://cima.aemps.es', '')
  return `https://corsproxy.io/?${encodeURIComponent(url)}`
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