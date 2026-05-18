import entry from '../dist/server/server.js';

export const config = {
  runtime: 'nodejs',
};

export default async function (request) {
  try {
    const fetchHandler = entry.fetch || (entry.default && entry.default.fetch);
    
    if (!fetchHandler) {
      return new Response("Missing fetch handler in server entry", { status: 500 });
    }

    return await fetchHandler(request, process.env, {});
  } catch (error) {
    // Print the EXACT crash error to the screen so we can debug it
    return new Response(
      "VERCEL CRASH REPORT: \n\n" + (error.stack || error.toString()),
      { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      }
    );
  }
}
