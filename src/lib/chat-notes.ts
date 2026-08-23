


// Since we cannot easily use a custom server in Next.js App Router Vercel deployments
// We will use a "Ref-based" pattern or just a separate service.
// However, for this project, we can make a simple API route that *initializes* the socket
// on the global object if it doesn't exist. This is a common "Next.js pages router hack"
// but harder in App Router.

// ALTERNATIVE: Use a simple Database-backed polling chat for "Global Chat" to be
// reliable and serverless-friendly.

// Let's implement Polling + Database first as it is 100% robust on Vercel/NextJS without custom servers.
// If user complains about lag, we can switch to Pusher/Socket.io external.

// We need a Chat Message model first.
