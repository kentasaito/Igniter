export class Kv {
  static async setup(path) {
    this.kv = await Deno.openKv(path);
  }

  static async getGroup(id = "") {
    const ids = id === "" ? [] : id.split(",");
    const group = {};
    const entries = this.kv.list({ prefix: [...ids] });
    for await (const entry of entries) {
      group[entry.key.slice(ids.length).join(",")] = entry.value;
    }
    return group;
  }

  static async get(id) {
    const ids = id.split(",");
    return (await this.kv.get([...ids])).value;
  }

  static async set(id, value) {
    const ids = id.split(",");
    await this.kv.set([...ids], value);
  }

  static async delete(id) {
    const ids = id.split(",");
    await this.kv.delete([...ids]);
  }

  static async deleteGroup(id = "") {
    const ids = id === "" ? [] : id.split(",");
    const entries = this.kv.list({ prefix: [...ids] });
    for await (const entry of entries) {
      await this.kv.delete(entry.key);
    }
  }
}
