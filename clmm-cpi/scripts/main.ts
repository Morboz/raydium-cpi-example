// import { initSdk } from '../config'
import { Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'


export const owner: Keypair = Keypair.fromSecretKey(
    Uint8Array.from([31,241,200,96,201,119,13,132,49,149,113,30,209,172,88,172,184,253,141,202,146,92,178,131,66,8,231,61,8,89,89,240,59,58,67,216,202,171,63,44,87,208,160,12,11,12,60,19,228,46,244,50,47,255,77,63,34,70,81,106,164,29,47,222]
)
)
export const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=7a0c609d-8499-4c2d-a6d1-6df062cd163c') //<YOUR_RPC_URL>
// export const connection = new Connection(clusterApiUrl('devnet')) //<YOUR_RPC_URL>
export const txVersion = TxVersion.V0 // or TxVersion.LEGACY
const cluster = 'mainnet' // 'mainnet' | 'devnet'

let raydium: Raydium | undefined
export const initSdk = async (params?: { loadToken?: boolean }) => {
  if (raydium) return raydium
  if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta'))
    console.warn('using free rpc node might cause unexpected error, strongly suggest uses paid rpc node')
  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: 'finalized',
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // api url configs, currently api doesn't support devnet
    // },
  })

  /**
   * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
   * if you want to handle token account by yourself, set token account data after init sdk
   * code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
   */

  /*  
  raydium.account.updateTokenAccount(await fetchTokenAccountData())
  connection.onAccountChange(owner.publicKey, async () => {
    raydium!.account.updateTokenAccount(await fetchTokenAccountData())
  })
  */

  return raydium
}

export const fetchTokenAccountData = async () => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey)
  const tokenAccountResp = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })
  const token2022Req = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_2022_PROGRAM_ID })
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  })
  return tokenAccountData
}


export const fetchRpcPoolInfo = async () => {
  const raydium = await initSdk()
  // RAY-USDC
//   const pool1 = '61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht'
  // SOL-USDC
  const pool2 = '8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj'

  const res = await raydium.clmm.getRpcClmmPoolInfos({
    poolIds: [
        // pool1, 
        pool2],
  })

//   const pool1Info = res[pool1]
  const pool2Info = res[pool2]

//   console.log('RAY-USDC pool price:', pool1Info.currentPrice)
  console.log('SOL-USDC pool price:', pool2Info.currentPrice)
  console.log('clmm pool infos:', res)

}

/** uncomment code below to execute */
fetchRpcPoolInfo()


