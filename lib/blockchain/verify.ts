// On-chain verification for TRC20 (TRON Grid) and ERC20 (Ethereum JSON-RPC).
// TRON Grid works for both mainnet and Shasta testnet — set env vars accordingly.
//
// Mainnet defaults:
//   TRON_GRID_URL=https://api.trongrid.io
//   TRON_USDT_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
//
// Shasta testnet:
//   TRON_GRID_URL=https://api.shasta.trongrid.io
//   TRON_USDT_CONTRACT=TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs

const TRON_GRID_URL = process.env.TRON_GRID_URL ?? 'https://api.trongrid.io'
const TRON_USDT_CONTRACT = (process.env.TRON_USDT_CONTRACT ?? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t').toLowerCase()
const ETH_RPC_URL = process.env.ETH_RPC_URL ?? 'https://cloudflare-eth.com'
const ETH_USDT_CONTRACT = (process.env.ETH_USDT_CONTRACT ?? '0xdAC17F958D2ee523a2206206994597C13D831ec7').toLowerCase()
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export interface VerifyResult {
  ok: boolean
  verifiedAmount?: number
  error?: string
}

interface TronGridEvent {
  event_name: string
  contract_address: string
  result: Record<string, string>
  result_type?: Record<string, string>
}

interface TronGridEventsResponse {
  data: TronGridEvent[]
}

interface EthLog {
  address: string
  topics: string[]
  data: string
}

interface EthReceipt {
  status: string
  logs: EthLog[]
}

export async function verifyTrc20Deposit(
  txHash: string,
  senderAddress: string,
  escrowAddress: string,
  minAmount: number
): Promise<VerifyResult> {
  try {
    // Check transaction is confirmed (only_confirmed=true returns empty data if not yet confirmed)
    const txRes = await fetch(
      `${TRON_GRID_URL}/v1/transactions/${encodeURIComponent(txHash)}?only_confirmed=true`,
      { cache: 'no-store' }
    )
    if (!txRes.ok) return { ok: false, error: 'Could not reach TRON API — try again later' }

    const txData = await txRes.json() as { data: unknown[] }
    if (!txData.data?.length) {
      return { ok: false, error: 'Transaction not confirmed yet. Please wait and try again.' }
    }

    // Fetch events to find the Transfer
    const evRes = await fetch(
      `${TRON_GRID_URL}/v1/transactions/${encodeURIComponent(txHash)}/events`,
      { cache: 'no-store' }
    )
    if (!evRes.ok) return { ok: false, error: 'Could not reach TRON API — try again later' }

    const evData = await evRes.json() as TronGridEventsResponse
    const transfer = evData.data?.find(e =>
      e.event_name === 'Transfer' &&
      e.contract_address.toLowerCase() === TRON_USDT_CONTRACT
    )

    if (!transfer) {
      return { ok: false, error: 'No USDT (TRC20) transfer found in this transaction' }
    }

    // TRON Grid returns named params (from/to/value) for known ABIs like USDT
    // Fall back to positional params (0/1/2) just in case
    const fromAddr = (transfer.result['from'] ?? transfer.result['0'] ?? '').toLowerCase()
    const toAddr = (transfer.result['to'] ?? transfer.result['1'] ?? '').toLowerCase()
    const valueStr = transfer.result['value'] ?? transfer.result['2'] ?? '0'

    if (fromAddr !== senderAddress.toLowerCase()) {
      return { ok: false, error: 'Sender address does not match your registered deposit wallet' }
    }
    if (toAddr !== escrowAddress.toLowerCase()) {
      return { ok: false, error: 'Transaction recipient is not the platform deposit address' }
    }

    const verifiedAmount = Number(valueStr) / 1_000_000 // USDT has 6 decimals on TRON

    if (verifiedAmount < minAmount) {
      return { ok: false, error: `Amount ${verifiedAmount.toFixed(2)} USDT is below the minimum deposit of ${minAmount} USDT` }
    }

    return { ok: true, verifiedAmount }
  } catch {
    return { ok: false, error: 'Blockchain verification failed — try again later' }
  }
}

export async function verifyErc20Deposit(
  txHash: string,
  senderAddress: string,
  escrowAddress: string,
  minAmount: number
): Promise<VerifyResult> {
  try {
    const res = await fetch(ETH_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, error: 'Could not reach Ethereum RPC — try again later' }

    const { result } = await res.json() as { result: EthReceipt | null }

    if (!result) {
      return { ok: false, error: 'Transaction not found or not confirmed yet. Please wait and try again.' }
    }
    if (result.status !== '0x1') {
      return { ok: false, error: 'Transaction failed on-chain. Please check and try again.' }
    }

    const log = result.logs.find(l =>
      l.address.toLowerCase() === ETH_USDT_CONTRACT &&
      l.topics[0] === TRANSFER_TOPIC &&
      l.topics.length === 3
    )
    if (!log) {
      return { ok: false, error: 'No USDT (ERC20) transfer found in this transaction' }
    }

    const fromAddr = '0x' + log.topics[1].slice(-40)
    const toAddr = '0x' + log.topics[2].slice(-40)

    if (fromAddr.toLowerCase() !== senderAddress.toLowerCase()) {
      return { ok: false, error: 'Sender address does not match your registered deposit wallet' }
    }
    if (toAddr.toLowerCase() !== escrowAddress.toLowerCase()) {
      return { ok: false, error: 'Transaction recipient is not the platform deposit address' }
    }

    const verifiedAmount = Number(BigInt(log.data)) / 1_000_000

    if (verifiedAmount < minAmount) {
      return { ok: false, error: `Amount ${verifiedAmount.toFixed(2)} USDT is below the minimum deposit of ${minAmount} USDT` }
    }

    return { ok: true, verifiedAmount }
  } catch {
    return { ok: false, error: 'Blockchain verification failed — try again later' }
  }
}
