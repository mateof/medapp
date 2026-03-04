import { db } from '../db';
import { useUiStore } from '@/stores/ui';

function getUserId() {
    const store = useUiStore();
    if (!store.activeUserId) throw new Error('No active user');
    return store.activeUserId;
}

// --- Actividad ---

export async function addActividad({ tipo, medId, medName, detalle }) {
    const userId = getUserId();
    await db.actividad.add({
        tipo,
        fecha: new Date().toISOString(),
        medId,
        medName,
        detalle,
        userId
    });
}

export async function getActividadReciente(limit = 20) {
    const userId = getUserId();
    const all = await db.actividad
        .where('userId').equals(userId)
        .toArray();
    return all
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, limit);
}

// --- Medicamentos CRUD ---

export async function addMedicamento(m, etiquetas = [], posologia = null) {
    const userId = getUserId();
    const plain = JSON.parse(JSON.stringify(m));
    const parsedTags = JSON.parse(JSON.stringify(etiquetas));
    const id = await db.medicamentos.add({
        name: plain.nombre,
        data: plain,
        nregistro: plain.nregistro,
        enfermedades: parsedTags,
        posologia: posologia ? JSON.parse(JSON.stringify(posologia)) : null,
        dateins: new Date().toISOString(),
        userId
    });
    await addActividad({
        tipo: 'med_added',
        medId: id,
        medName: plain.nombre,
        detalle: `Medicamento añadido: ${plain.nombre}`
    });
    for (const tag of parsedTags) {
        await addActividad({
            tipo: 'tag_added',
            medId: id,
            medName: plain.nombre,
            detalle: `Etiqueta "${tag}" asignada a ${plain.nombre}`
        });
    }
}

export async function getMedicamentos() {
    const userId = getUserId();
    return await db.medicamentos.where('userId').equals(userId).toArray();
}

export async function getMedicamentoById(id) {
    const med = await db.medicamentos.get(id);
    if (med && med.userId !== getUserId()) return null;
    return med;
}

export async function deleteMedicamentos(id) {
    const userId = getUserId();
    const med = await db.medicamentos.get(id);
    if (!med || med.userId !== userId) return;
    const medName = med.name || 'Desconocido';
    await db.medicamentos.where('id').equals(id).delete();
    await addActividad({
        tipo: 'med_deleted',
        medId: id,
        medName,
        detalle: `Medicamento eliminado: ${medName}`
    });
}

export async function existsInDatabase(nregistro) {
    if (!nregistro) return false;
    const userId = getUserId();
    const a = await db.medicamentos
        .where('nregistro').equals(nregistro)
        .filter(m => m.userId === userId)
        .toArray();
    return a.length > 0;
}

// --- Dashboard stats ---

export async function getDistinctEtiquetas() {
    const userId = getUserId();
    const meds = await db.medicamentos.where('userId').equals(userId).toArray();
    const all = meds.flatMap(m => m.enfermedades || []);
    return [...new Set(all)];
}

export async function getMedicamentoCount() {
    const userId = getUserId();
    return await db.medicamentos.where('userId').equals(userId).count();
}

export async function getMedicamentosPorEnfermedad() {
    const userId = getUserId();
    const meds = await db.medicamentos.where('userId').equals(userId).toArray();
    const tagCounts = {};
    for (const med of meds) {
        const tags = med.enfermedades || [];
        if (tags.length === 0) {
            tagCounts['Sin clasificar'] = (tagCounts['Sin clasificar'] || 0) + 1;
        } else {
            for (const tag of tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
    }
    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
}

export async function getActividadPorMes(months = 6) {
    const userId = getUserId();
    const actividades = await db.actividad.where('userId').equals(userId).toArray();
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthActs = actividades.filter(a => a.fecha.startsWith(key));
        result.push({
            month: key,
            adds: monthActs.filter(a => a.tipo === 'med_added').length,
            deletes: monthActs.filter(a => a.tipo === 'med_deleted').length,
            tags: monthActs.filter(a => a.tipo === 'tag_added').length,
        });
    }
    return result;
}

// --- Settings (scoped per user) ---

export async function getSetting(key) {
    const userId = getUserId();
    const row = await db.settings.get(`user_${userId}_${key}`);
    return row ? row.value : null;
}

export async function setSetting(key, value) {
    const userId = getUserId();
    await db.settings.put({ key: `user_${userId}_${key}`, value });
}

// --- Interacciones ---

export async function saveInteraccion(data) {
    const userId = getUserId();
    await db.interacciones.add({
        ...data,
        fecha: new Date().toISOString(),
        userId
    });
}

export async function getInteracciones() {
    const userId = getUserId();
    const all = await db.interacciones
        .where('userId').equals(userId)
        .toArray();
    return all.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function getInteraccionByMedId(medId, medName) {
    const all = await getInteracciones();
    return all.find(i => {
        if ((i.medIds || []).includes(medId)) return true;
        if (medName) {
            const nameLower = medName.toLowerCase();
            const firstWord = nameLower.split(/[\s(,]/)[0];
            return (i.medNames || []).some(n => {
                const nl = n.toLowerCase();
                if (nl.includes(nameLower) || nameLower.includes(nl)) return true;
                const fw = nl.split(/[\s(,]/)[0];
                return fw.length >= 3 && firstWord.length >= 3 && fw === firstWord;
            });
        }
        return false;
    }) || null;
}

export async function getLatestInteraccion() {
    const all = await getInteracciones();
    return all[0] || null;
}

// --- Shared settings (not scoped to user) ---

export async function getSharedSetting(key) {
    const row = await db.settings.get(`shared_${key}`);
    return row ? row.value : null;
}

export async function setSharedSetting(key, value) {
    await db.settings.put({ key: `shared_${key}`, value });
}

export async function deleteSharedSetting(key) {
    await db.settings.delete(`shared_${key}`);
}

export async function deleteInteraccionesByMedId(medId, medName) {
    const userId = getUserId();
    const all = await db.interacciones.where('userId').equals(userId).toArray();
    const nameLower = (medName || '').toLowerCase();
    const firstWord = nameLower.split(/[\s(,]/)[0];
    const idsToDelete = all
        .filter(i => {
            if ((i.medIds || []).includes(medId)) return true;
            if (nameLower && (i.medNames || []).some(n => {
                const nl = n.toLowerCase();
                if (nl.includes(nameLower) || nameLower.includes(nl)) return true;
                const fw = nl.split(/[\s(,]/)[0];
                return fw.length >= 3 && firstWord.length >= 3 && fw === firstWord;
            })) return true;
            return false;
        })
        .map(i => i.id);
    if (idsToDelete.length > 0) {
        await db.interacciones.bulkDelete(idsToDelete);
    }
}
