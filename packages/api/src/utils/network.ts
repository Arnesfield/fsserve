import { networkInterfaces } from 'os';

export function getAddresses(): string[] {
  const addresses: string[] = ['localhost'];
  for (const networks of Object.values(networkInterfaces())) {
    for (const network of networks || []) {
      if (!network.internal && network.family === 'IPv4') {
        addresses.push(network.address);
      }
    }
  }
  return addresses;
}
