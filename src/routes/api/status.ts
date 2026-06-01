import { eventHandler } from "vinxi/http";

export default eventHandler((event) => {
  const method = event.node.req.method || "GET";

  event.node.res.setHeader("Content-Type", "text/plain");
  event.node.res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (method.toUpperCase() === "HEAD") {
    event.node.res.statusCode = 200;
    event.node.res.end();
    return;
  }

  return "OK";
});
