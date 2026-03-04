export function getDocumentsFromDrug(data) {
    const docs = [];
    if (!data) return docs;
    for (const doc of data) {
        const d = {...doc};
        d.tipoString = convertDocumentTypes(doc.tipo);
        d.hasUrl = !!doc.url;
        d.hasUrlHtml = !!doc.urlHtml;
        docs.push(d);
    }
    return docs;
}


export function getPresentacionesPSum(medicamento) {
    if (!medicamento?.presentaciones) return [];
    return medicamento.presentaciones.filter( x => !!x.psum);
}

function convertDocumentTypes(docType) {
    switch (docType) {
        case 1:
            return "Ficha Técnica";
        case 2:
            return "Prospecto";
        case 3:
            return "Informe Público Evaluación";
        case 4:
            return "Plan de gestión de riesgos";
        default:
            return "";
    }
}