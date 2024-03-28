import { Igniter } from "../mod.js";

/**
 * PHPのようなSSR
 */
export class Xjs {
  /**
   * Xjsのインスタンス化
   *
   * Igniter内部からリクエストごとに呼び出されます。
   * @param req リクエスト
   */
  constructor(req) {
    this.req = req;
    this.buffers = [""];
  }

  /**
   * ファイルの読み込みと評価
   *
   * Xjsファイルを読み込み、その評価値を出力します。
   * @param path 読み込むファイルのパス
   * @param params 読み込むファイルへ渡すパラメータ
   */
  require(path, params) {
    params;
    const depth = this.buffers.length - 1;
    this.buffers[depth] += Deno.readTextFileSync(
      Igniter.params.appPath + "/views" + path + ".xjs",
    );
    while (true) {
      const matches = this.buffers[depth].match(/<\?(.*?)\?>/s);
      if (!matches) break;
      this.buffers.push("");
      eval(matches[1]);
      this.buffers[depth] = this.buffers[depth].replace(
        matches[0],
        this.buffers.pop(),
      );
    }
  }

  /**
   * 値の出力
   *
   * 値を文字列として出力します。
   * @param value 出力する値
   */
  echo(value) {
    this.buffers[this.buffers.length - 1] += value;
  }

  /**
   * JSONの出力
   *
   * オブジェクトをJSONとして出力します。
   * @param obj 出力するオブジェクト
   */
  json(obj) {
    this.buffers[this.buffers.length - 1] += JSON.stringify(obj, null, 2);
  }
}
