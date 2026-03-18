import browser from 'webextension-polyfill'
import type { VaultRequest, VaultResponse } from '@ppm/shared'

export async function sendMessage(req: VaultRequest): Promise<VaultResponse> {
  return browser.runtime.sendMessage(req) as Promise<VaultResponse>
}
