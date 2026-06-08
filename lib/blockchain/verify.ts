// On-chain verification for TRC20 (TRON) and ERC20 (Ethereum) USDT deposits.
// Uses Tronscan public API for TRON and a public ETH JSON-RPC for Ethereum.
// All env vars default to mainnet — set to testnet values for testing.

const TRON_API_URL = process.env.TRON_API_URL ?? 'https://apilist.tronscanapi.com'
const TRON_USDT_CONTRACT = process.env.TRON_USDT_CONTRACT ?? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const ETH_RPC_URL = process.env.ETH_RPC_URL ?? 'https://cloudflare-eth.com'
const ETH_USDT_CONTRACT = (process.env.ETH_USDT_CONTRACT ?? '0xdAC17F958D2ee523a2206206994597C13D831ec7').toLowerCase()
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export interface VerifyResult {
  ok: boolean
  verifiedAmount?: number
  error?: string
}

interface TronscanTransfer {
  from_address: string
  to_address: string
  amount_str: string
  decimals: number
  contract_address: string
}

interface TronscanTx {
  confirmed: boolean
  trc20TransferInfo?: TronscanTransfer[]
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
    const url = `${TRON_API_URL}/api/transaction-info?hash=${encodeURIComponent(txHash)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: 'Could not reach TRON API — try again later' }

    const tx = await res.json() as TronscanTx

    if (!tx.confirmed) {
      return { ok: false, error: 'Transaction not confirmed yet — wait a moment and resubmit' }
    }

    const transfer = tx.trc20TransferInfo?.[0]
    if (!transfer) {
      return { ok: false, error: 'No TRC20 token transfer found in this transaction' }
    }

    if (transfer.contract_address !== TRON_USDT_CONTRACT) {
      return { ok: false, error: 'Transaction is not a USDT (TRC20) transfer' }
    }

    if (transfer.from_address.toLowerCase() !== senderAddress.toLowerCase()) {
      return { ok: false, error: 'Sender address does not match your registered deposit wallet' }
    }

    if (transfer.to_address.toLowerCase() !== escrowAddress.toLowerCase()) {
      return { ok: false, error: 'Transaction recipient is not the platform deposit address' }
    }

    const decimals = transfer.decimals ?? 6
    const verifiedAmount = Number(transfer.amount_str) / Math.pow(10, decimals)

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
      return { ok: false, error: 'Transaction not found — it may not be confirmed yet' }
    }
    if (result.status !== '0x1') {
      return { ok: false, error: 'Transaction failed on-chain' }
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
