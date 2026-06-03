import { createServer } from "node:http";
import next from "next";

const dev = process.env.NODE_ENV === "development";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function getHeaderValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeIngressPath(value) {
  if (!value || !value.startsWith("/")) {
    return "";
  }

  return value.replace(/\/+$/, "");
}

function shouldRewriteResponse(req) {
  const url = req.url || "";

  return !(
    url.startsWith("/_next/") ||
    url.startsWith("/api/") ||
    url.startsWith("/uploads/") ||
    url.startsWith("/favicons/") ||
    url === "/favicon.ico"
  );
}

function rewriteIngressAssets(body, ingressPath) {
  return body
    .replaceAll('"/_next/', `"${ingressPath}/_next/`)
    .replaceAll("'/_next/", `'${ingressPath}/_next/`)
    .replaceAll('\\"/_next/', `\\"${ingressPath}/_next/`)
    .replaceAll('"/favicon.ico', `"${ingressPath}/favicon.ico`)
    .replaceAll("'/favicon.ico", `'${ingressPath}/favicon.ico`)
    .replaceAll('\\"/favicon.ico', `\\"${ingressPath}/favicon.ico`);
}

function splitEncodingAndCallback(encoding, callback) {
  if (typeof encoding === "function") {
    return { encoding: undefined, callback: encoding };
  }

  return { encoding, callback };
}

function installIngressAssetRewrite(req, res, ingressPath) {
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const originalWriteHead = res.writeHead.bind(res);
  const chunks = [];

  res.writeHead = (...args) => {
    res.removeHeader("content-length");
    return originalWriteHead(...args);
  };

  res.write = (chunk, encoding, callback) => {
    const args = splitEncodingAndCallback(encoding, callback);

    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, args.encoding));
    }

    if (typeof args.callback === "function") {
      args.callback();
    }

    return true;
  };

  res.end = (chunk, encoding, callback) => {
    const args = splitEncodingAndCallback(encoding, callback);

    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, args.encoding));
    }

    const contentType = String(res.getHeader("content-type") || "");
    const shouldPatch =
      contentType.includes("text/html") || contentType.includes("text/x-component");

    if (!shouldPatch) {
      for (const bufferedChunk of chunks) {
        originalWrite(bufferedChunk);
      }

      return originalEnd(undefined, undefined, args.callback);
    }

    const rewritten = rewriteIngressAssets(Buffer.concat(chunks).toString("utf8"), ingressPath);

    return originalEnd(rewritten, "utf8", args.callback);
  };
}

await app.prepare();

createServer((req, res) => {
  const ingressPath = normalizeIngressPath(getHeaderValue(req.headers["x-ingress-path"]));

  if (ingressPath && shouldRewriteResponse(req)) {
    installIngressAssetRewrite(req, res, ingressPath);
  }

  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`BJP Keep ready on http://${hostname}:${port}`);
});
