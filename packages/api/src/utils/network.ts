import { NetworkInterfaceInfoIPv4, networkInterfaces } from 'os';

export function getNetworks(): NetworkInterfaceInfoIPv4[] {
  const allNetworks: NetworkInterfaceInfoIPv4[] = [];
  for (const networks of Object.values(networkInterfaces())) {
    const nets = (networks || []).filter(
      (network): network is NetworkInterfaceInfoIPv4 => {
        return !network.internal && network.family === 'IPv4';
      }
    );
    allNetworks.push(...nets);
  }
  return allNetworks;
}
