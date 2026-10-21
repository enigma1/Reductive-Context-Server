export type Primitive = null | boolean | number | string;
export type JsonTypes = Primitive | JsonArray | JsonObject;
export type JsonArray = Array<JsonTypes>;
export type JsonObject = { [key in string]: JsonTypes };
