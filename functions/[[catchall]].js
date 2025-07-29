export async function onRequest(context) {
  try {
    return await context.next();
  } catch {
    // For SPA routing, return index.html for non-asset requests
    const url = new URL(context.request.url);
    if (!url.pathname.includes('.') && !url.pathname.startsWith('/assets/')) {
      return context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
    }
    throw new Error('Not found');
  }
}
