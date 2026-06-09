# tunnel-registry-client

Client library for looking up tunnel URLs stored in a Google Sheets registry (as managed by [tunnel-registry](https://github.com/ricardo-silva91/tunnel-registry)).

## Installation

```bash
npm install @ricardo-silva91/tunnel-registry-client
```

## Setup

The library authenticates with Google Sheets using a service account. You'll need to:

1. Create a service account in Google Cloud Console and download its JSON key.
2. Share your Google Sheet with the service account's email address (Viewer role is enough).
3. Set the environment variables below.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `TUNNEL_REGISTRY_SHEET_ID` | yes | Google Sheet ID (the long string in the sheet URL) |
| `TUNNEL_REGISTRY_SERVICE_ACCOUNT_EMAIL` | yes | `client_email` from the service account JSON key |
| `TUNNEL_REGISTRY_PRIVATE_KEY` | yes | `private_key` from the service account JSON key (raw or `\n`-escaped) |
| `TUNNEL_REGISTRY_WORKSHEET` | no | Worksheet name, defaults to `Tunnels` |

## Sheet schema

Row 1 must be a header row with at least these two columns:

| Service | URL |
|---|---|
| my-api | https://abc123.ngrok.io |
| other-service | |

A blank URL means the service is offline.

## Usage

```ts
import { getTunnelUrl, getAllTunnels } from '@ricardo-silva91/tunnel-registry-client';

// Get a single service's tunnel URL, or null if offline/not found
const url = await getTunnelUrl('my-api');
if (url) {
  console.log('Tunnel is live at', url);
} else {
  console.log('Service is offline');
}

// Get all live services at once
const tunnels = await getAllTunnels();
// { 'my-api': 'https://abc123.ngrok.io', ... }
```

## API

### `getTunnelUrl(serviceName: string): Promise<string | null>`

Returns the tunnel URL for the named service, or `null` if the service is not found or its URL is empty.

### `getAllTunnels(): Promise<Record<string, string>>`

Returns a map of all services that currently have a non-empty URL. Useful for dashboards or health checks.
