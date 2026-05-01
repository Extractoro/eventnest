// Force IPv4 DNS resolution before any network connections are made.
// Some environments (e.g. Render) resolve hostnames to IPv6 addresses that are
// unreachable on IPv4-only hosts, causing ENETUNREACH on SMTP and other sockets.
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { env } from './config/env';
import app from './app';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});
