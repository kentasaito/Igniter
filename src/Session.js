import { getCookies, setCookie, ulid } from "../deps.js";
import { Kv } from "../mod.js";

export class Session {
  resHeaders;
  sessionId;

  static getInstance(reqHeaders, resHeaders) {
    const instance = new Session();
    instance.resHeaders = resHeaders;
    instance.sessionId = getCookies(reqHeaders).sessionId;
    if (!instance.sessionId) {
      instance.sessionId = ulid();
      instance.setSessionId(instance.sessionId);
    }
    return instance;
  }

  async getGroup(id = "") {
    const ids = id === "" ? [] : id.split(",");
    const group = {};
    const entries = Kv.kv.list({ prefix: ["session", this.sessionId, ...ids] });
    for await (const entry of entries) {
      group[entry.key.slice(2 + ids.length).join(",")] = entry.value;
    }
    return group;
  }

  async get(id) {
    const ids = id.split(",");
    return (await Kv.kv.get(["session", this.sessionId, ...ids])).value;
  }

  async set(id, value) {
    const ids = id.split(",");
    await Kv.kv.set(["session", this.sessionId, ...ids], value);
  }

  async delete(id) {
    const ids = id.split(",");
    await Kv.kv.delete(["session", this.sessionId, ...ids]);
  }

  async deleteGroup(id = "") {
    const ids = id === "" ? [] : id.split(",");
    const entries = Kv.kv.list({ prefix: ["session", this.sessionId, ...ids] });
    for await (const entry of entries) {
      await Kv.kv.delete(entry.key);
    }
  }

  async destroy() {
    await this.deleteGroup();
    this.setSessionId(null);
  }

  setSessionId(sessionId) {
    setCookie(this.resHeaders, {
      name: "sessionId",
      value: sessionId,
      path: "/",
      maxAge: sessionId === null ? 0 : undefined,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }
}
