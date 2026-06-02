const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateId() {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

class Model {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}.json`);
  }

  _read() {
    try {
      if (fs.existsSync(this.filePath)) return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } catch (e) { /* ignore */ }
    return [];
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _wrap(doc) {
    if (!doc) return doc;
    const model = this;
    const wrapped = { ...doc };
    wrapped.save = function() { return model._updateDoc(this); };
    return wrapped;
  }

  _wrapArray(arr) {
    return arr.map(d => this._wrap(d));
  }

  _updateDoc(doc) {
    const data = this._read();
    const idx = data.findIndex(d => String(d._id) === String(doc._id));
    if (idx >= 0) {
      data[idx] = { ...doc, updatedAt: new Date().toISOString() };
      delete data[idx].save;
    } else {
      const item = { ...doc, updatedAt: new Date().toISOString() };
      delete item.save;
      data.push(item);
    }
    this._write(data);
    return Promise.resolve(this._wrap(data[idx !== -1 ? idx : data.length - 1]));
  }

  find(filter = {}) {
    let data = this._read();
    if (filter._id) data = data.filter(d => d._id === filter._id);
    if (filter.streamKey) {
      if (filter.streamKey.$ne === null) {
        data = data.filter(d => d.streamKey != null && d.streamKey !== '');
      }
    }
    return new Query(data, this, false);
  }

  findOne(filter = {}) {
    let data = this._read();
    for (const key of Object.keys(filter)) {
      data = data.filter(d => String(d[key]) === String(filter[key]));
    }
    return new Query(data, this, true);
  }

  findById(id) {
    const data = this._read();
    const doc = data.find(d => String(d._id) === String(id));
    return Promise.resolve(this._wrap(doc || null));
  }

  create(doc) {
    const data = this._read();
    const now = new Date().toISOString();
    const item = { _id: generateId(), ...doc, createdAt: doc.createdAt || now, updatedAt: now };
    data.push(item);
    this._write(data);
    return Promise.resolve(this._wrap(item));
  }

  save(doc) {
    return this._updateDoc(doc);
  }

  findByIdAndUpdate(id, update) {
    const data = this._read();
    const idx = data.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return Promise.resolve(null);
    data[idx] = { ...data[idx], ...update, updatedAt: new Date().toISOString() };
    delete data[idx].save;
    this._write(data);
    return Promise.resolve(this._wrap(data[idx]));
  }

  findByIdAndDelete(id) {
    const data = this._read();
    const idx = data.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return Promise.resolve(null);
    const deleted = data.splice(idx, 1)[0];
    this._write(data);
    return Promise.resolve(deleted);
  }
}

class Query {
  constructor(data, model, single = false) {
    this._data = data;
    this._model = model;
    this._single = single;
  }

  sort(sortObj) {
    const key = Object.keys(sortObj)[0];
    const dir = sortObj[key];
    this._data.sort((a, b) => {
      const va = a[key] || '', vb = b[key] || '';
      if (dir === -1) return vb > va ? 1 : vb < va ? -1 : 0;
      return va > vb ? 1 : va < vb ? -1 : 0;
    });
    return this;
  }

  limit(n) {
    this._data = this._data.slice(0, n);
    return this;
  }

  then(resolve) {
    let result;
    if (this._single) {
      result = this._data.length > 0 ? this._model._wrap(this._data[0]) : null;
    } else {
      result = this._model._wrapArray(this._data);
    }
    return Promise.resolve(result).then(resolve);
  }
}

const models = {};

module.exports = {
  createModel(name, schema) {
    const model = new Model(name, schema);
    models[name] = model;
    return model;
  },
  getModel(name) {
    return models[name];
  }
};
