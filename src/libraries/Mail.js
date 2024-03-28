import { SmtpClient } from "../../deps.js";

export class Mail {
  static sendConfig;
  static smtpClient;

  static setup(config) {
    this.sendConfig = config.send;
    this.smtpClient = new SmtpClient();
    return this.smtpClient.connect(config.connect);
  }

  static send(sendConfig) {
    sendConfig = Object.assign({}, this.sendConfig, sendConfig);
    sendConfig.subject = "=?utf-8?B?" +
      btoa(unescape(encodeURIComponent(sendConfig.subject))) + "?=";
    sendConfig.html ??= sendConfig.content.replace(/\n/g, "<br>");
    return this.smtpClient.send(sendConfig);
  }

  static close() {
    return this.smtpClient.close();
  }
}
