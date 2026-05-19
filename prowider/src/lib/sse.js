const clients = new Set();

export function addSSEClient(res) {
  clients.add(res);
}

export function removeSSEClient(res) {
  clients.delete(res);
}

export function broadcastLeadUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}