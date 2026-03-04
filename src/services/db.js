// db.js
import Dexie from 'dexie';

export const db = new Dexie('meddatabase');
db.version(1).stores({
  medicamentos: '++id, name, data, datos' // Primary key and indexed props
});

db.version(2).stores({
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate', // Primary key and indexed props
}).upgrade(trans => {
  return trans.medicamentos.toCollection().modify (med => {
    med.nregistro = med.data.nregistro;
  });
});

db.version(3).stores({
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate',
  actividad: '++id, tipo, fecha, medId, medName'
}).upgrade(trans => {
  return trans.medicamentos.toCollection().modify(med => {
    if (!med.dateins) med.dateins = new Date().toISOString();
  });
});

db.version(4).stores({
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate',
  actividad: '++id, tipo, fecha, medId, medName',
  settings: 'key',
  interacciones: '++id, fecha, severidad'
});

db.version(5).stores({
  usuarios: '++id, nombre, createdAt',
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate, userId',
  actividad: '++id, tipo, fecha, medId, medName, userId',
  settings: 'key',
  interacciones: '++id, fecha, severidad, userId'
}).upgrade(async trans => {
  const medCount = await trans.table('medicamentos').count();
  const actCount = await trans.table('actividad').count();
  const interCount = await trans.table('interacciones').count();

  if (medCount === 0 && actCount === 0 && interCount === 0) return;

  const defaultUserId = await trans.table('usuarios').add({
    nombre: 'Usuario',
    pin_check: null,
    avatar: null,
    createdAt: new Date().toISOString()
  });

  await trans.table('medicamentos').toCollection().modify(med => {
    med.userId = defaultUserId;
  });
  await trans.table('actividad').toCollection().modify(act => {
    act.userId = defaultUserId;
  });
  await trans.table('interacciones').toCollection().modify(inter => {
    inter.userId = defaultUserId;
  });

  const allSettings = await trans.table('settings').toArray();
  for (const setting of allSettings) {
    if (['gemini_api_key_encrypted', 'gemini_api_key', 'gemini_model'].includes(setting.key)) {
      await trans.table('settings').put({
        key: `user_${defaultUserId}_${setting.key}`,
        value: setting.value
      });
      await trans.table('settings').delete(setting.key);
    }
  }
});

db.version(6).stores({
  usuarios: '++id, nombre, createdAt, esMascota',
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate, userId',
  actividad: '++id, tipo, fecha, medId, medName, userId',
  settings: 'key',
  interacciones: '++id, fecha, severidad, userId'
}).upgrade(trans => {
  return trans.table('usuarios').toCollection().modify(user => {
    if (user.enfermedades_cronicas === undefined) user.enfermedades_cronicas = []
    if (user.alergias === undefined) user.alergias = []
    if (user.peculiaridades === undefined) user.peculiaridades = []
    if (user.esMascota === undefined) user.esMascota = false
    if (user.tipoMascota === undefined) user.tipoMascota = null
  })
});

db.version(7).stores({
  usuarios: '++id, nombre, createdAt, esMascota',
  medicamentos: '++id, name, data, datos, nregistro, *enfermedades, *sintomas, dateins, dateupd, syncstate, syncdate, userId',
  actividad: '++id, tipo, fecha, medId, medName, userId',
  settings: 'key',
  interacciones: '++id, fecha, severidad, userId'
}).upgrade(trans => {
  return trans.table('usuarios').toCollection().modify(user => {
    if (user.peso === undefined) user.peso = null
    if (user.edad === undefined) user.edad = null
    if (user.genero === undefined) user.genero = null
  })
});

db.open();