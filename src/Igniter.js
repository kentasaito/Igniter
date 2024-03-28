import "https://deno.land/std@0.221.0/dotenv/load.ts";
import { existsSync, serveDir } from "../deps.js";
import { Kv, Session, Xjs } from "../mod.js";

/**
 * CodeIgniterのようなフレームワーク
 *
 * /api/から始まるリクエストはAPIリクエストとして、ビューファイルが存在するリクエストはページリクエストとして、それ以外は静的リクエストとして扱います。
 * アプリケーションのパスをparams.appPathとして指定します。
 */
export class Igniter {
  static params;

  /**
   * Igniterの開始
   *
   * Ignaiterの処理を開始します。
   * @param params パラメータ
   */
  static async ignite(params) {
    this.params = params;
    await Kv.setup(this.params.kvPath);
    Deno.serve({ port: Deno.env.get("PORT") }, async (req) => {
      const url = new URL(req.url);
      req.path = new URL(req.url).pathname.replace(/\/$/, "/index");
      req.searchParams = Object.fromEntries(url.searchParams.entries());
      const res = {
        headers: new Headers(),
      };
      req.session = Session.getInstance(req.headers, res.headers);
      const xjs = new Xjs(req);

      // APIリクエスト
      if (req.path.startsWith("/api/") && params.routes[req.path]) {
        res.headers.set("content-type", "application/json; charset=UTF-8");

        // APIを呼び出す
        const data = await params.routes[req.path](req, res);

        // JSONを返す
        return new Response(JSON.stringify(data), res);
      }

      // ページリクエスト
      if (
        existsSync(this.params.appPath + "/views/pages" + req.path + ".xjs")
      ) {
        res.headers.set("content-type", "text/html; charset=UTF-8");
        let data = {};

        // コントローラがあれば呼び出す
        if (params.routes[req.path]) {
          data = await (await import(
            this.params.appPath + "/controllers" + req.path + ".js"
          )).default(req);
        }

        // ビューを返す
        req.sessionValues = await req.session.getGroup();
        xjs.require("/template", { data });
        return new Response(xjs.buffers[0], res);
      }

      // 静的リクエスト
      return serveDir(req, {
        fsRoot: this.params.appPath + "/static",
        quiet: true,
      });
    });
  }
}
