import entry from '../dist/server/server.js';

export const config = {
  runtime: 'nodejs',
};

export default async function (request) {
  const fetchHandler = entry.fetch || (entry.default && entry.default.fetch);
  
  if (!fetchHandler) {
    return new Response("Missing fetch handler in server entry", { status: 500 });
  }

  // Vercel Web Functions pass the native Request object!
  return fetchHandler(request, process.env, {});
}
