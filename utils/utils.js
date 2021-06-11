const jsonQuery = require("json-query");

module.exports = {
  getDateNow() {
    return new Date().toJSON().slice(0, 10).replace(/-/g, "/");
  },

  createUUID() {
    let dt = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  },
  getJsonValueString(json, jsonPath) {
    return jsonQuery(jsonPath, {
      data: JSON.parse(json),
    }).value;
  },
  getJsonValueArray(json, jsonPath) {
    return jsonQuery(jsonPath, {
      data: JSON.parse(json),
    }).value;
  },
};
